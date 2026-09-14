import logging
import threading
import time
from pathlib import Path
from typing import Annotated

import numpy as np
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel

from app.schemas.models import (
    TrainConfigRequest,
    TrainStatusResponse,
    PredictRequest,
    PredictResponse,
    WeightsResponse,
    LayerWeights,
    BackpropRequest,
    BackpropResponse,
)
from app.model.network import NeuralNetwork
from app.dataset.mnist_loader import load_mnist

logger = logging.getLogger(__name__)
router = APIRouter()

# Global model instance
WEIGHTS_PATH = Path(__file__).parent.parent.parent / "weights" / "model.npz"
CUSTOM_WEIGHTS_PATH = Path(__file__).parent.parent.parent / "weights" / "custom_model.npz"
global_nn = NeuralNetwork(seed=42)

# Global training state
class TrainState:
    def __init__(self):
        self.status = "idle"
        self.epoch = 0
        self.total_epochs = 0
        self.batch = 0
        self.total_batches = 0
        self.loss = 0.0
        self.accuracy = 0.0
        self.val_loss = None
        self.val_accuracy = None
        self.error = None
        self._stop_requested = False
        self.history = []

    def reset(self):
        self.__init__()

train_state = TrainState()

# Try to load pre-trained weights on startup
try:
    if WEIGHTS_PATH.exists():
        global_nn.load(WEIGHTS_PATH)
        logger.info(f"Loaded pre-trained weights from {WEIGHTS_PATH}")
    else:
        logger.warning(f"No pre-trained weights found at {WEIGHTS_PATH}")
except Exception as e:
    logger.error(f"Failed to load pre-trained weights: {e}")

def _training_loop(config: TrainConfigRequest):
    """
    Background thread function to run the training loop.
    """
    global train_state
    
    try:
        train_state.status = "training"
        train_state.total_epochs = config.epochs
        
        # Load dataset
        X, y = load_mnist(split='train', subset_size=config.subset_size)
        
        # Validation split
        num_samples = len(X)
        val_size = int(num_samples * config.validation_split)
        train_size = num_samples - val_size
        
        # Shuffle
        rng = np.random.default_rng(config.seed)
        indices = rng.permutation(num_samples)
        X, y = X[indices], y[indices]
        
        X_train, y_train = X[:train_size], y[:train_size]
        X_val, y_val = X[train_size:], y[train_size:]
        
        train_state.total_batches = int(np.ceil(train_size / config.batch_size))
        
        # Isolate training to a new instance to preserve global_nn for predictions
        training_nn = NeuralNetwork(seed=config.seed)
        
        for epoch in range(config.epochs):
            if train_state._stop_requested:
                break
                
            train_state.epoch = epoch + 1
            
            # Shuffle at start of epoch
            epoch_indices = rng.permutation(train_size)
            X_train_shuffled = X_train[epoch_indices]
            y_train_shuffled = y_train[epoch_indices]
            
            epoch_loss = 0
            correct = 0
            batches = 0
            
            for i in range(0, train_size, config.batch_size):
                if train_state._stop_requested:
                    break
                    
                train_state.batch = batches + 1
                
                X_batch = X_train_shuffled[i:i+config.batch_size]
                y_batch = y_train_shuffled[i:i+config.batch_size]
                
                # One-hot
                y_one_hot = np.zeros((len(y_batch), 10))
                y_one_hot[np.arange(len(y_batch)), y_batch] = 1
                
                # Forward
                probs = training_nn.forward(X_batch, training=True)
                loss = training_nn.loss_fn.forward(probs, y_one_hot)
                
                # Metrics
                epoch_loss += loss
                preds = np.argmax(probs, axis=1)
                correct += np.sum(preds == y_batch)
                batches += 1
                
                train_state.loss = epoch_loss / batches
                train_state.accuracy = float(correct / (batches * config.batch_size))
                
                # Backward
                d_loss = training_nn.loss_fn.backward()
                training_nn.backward(d_loss)
                
                # Update
                training_nn.update_weights(config.learning_rate)
            
            # Validation at end of epoch
            if val_size > 0 and not train_state._stop_requested:
                val_loss, val_acc = training_nn.evaluate(X_val, y_val)
                train_state.val_loss = val_loss
                train_state.val_accuracy = val_acc
                
            # Record history
            if not train_state._stop_requested:
                train_state.history.append({
                    "epoch": train_state.epoch,
                    "loss": train_state.loss,
                    "accuracy": train_state.accuracy,
                    "val_loss": train_state.val_loss,
                    "val_accuracy": train_state.val_accuracy
                })
        
        if train_state._stop_requested:
            train_state.status = "idle"
        else:
            train_state.status = "completed"
            # Automatically save best weights to custom path, preserving pretrained weights
            training_nn.save(CUSTOM_WEIGHTS_PATH)
            
    except Exception as e:
        logger.exception("Training failed")
        train_state.status = "failed"
        train_state.error = str(e)


@router.post("/model/train", response_model=dict, tags=["Model"])
async def start_training(config: TrainConfigRequest, background_tasks: BackgroundTasks):
    """
    Start a background training job.
    """
    if train_state.status == "training":
        raise HTTPException(status_code=400, detail="Training is already in progress.")
        
    train_state.reset()
    
    # Run in a separate thread so we don't block the async event loop
    thread = threading.Thread(target=_training_loop, args=(config,))
    thread.start()
    
    return {"message": "Training started"}


@router.get("/model/status", response_model=TrainStatusResponse, tags=["Model"])
async def get_training_status():
    """
    Get current training progress.
    """
    return TrainStatusResponse(
        status=train_state.status,
        epoch=train_state.epoch,
        total_epochs=train_state.total_epochs,
        batch=train_state.batch,
        total_batches=train_state.total_batches,
        loss=train_state.loss,
        accuracy=train_state.accuracy,
        val_loss=train_state.val_loss,
        val_accuracy=train_state.val_accuracy,
        error=train_state.error,
        history=train_state.history
    )


@router.post("/model/stop", response_model=dict, tags=["Model"])
async def stop_training():
    """
    Stop the currently running training job.
    """
    if train_state.status != "training":
        raise HTTPException(status_code=400, detail="No training in progress.")
        
    train_state._stop_requested = True
    return {"message": "Stop requested."}


@router.post("/model/predict", response_model=PredictResponse, tags=["Model"])
async def predict(request: PredictRequest):
    """
    Make a prediction on a preprocessed 28x28 image.
    """
    arr = np.array(request.flat_array, dtype=np.float32)
    if arr.shape != (784,):
        raise HTTPException(status_code=422, detail="flat_array must have exactly 784 elements.")
    if not np.isfinite(arr).all():
        raise HTTPException(status_code=422, detail="flat_array must contain only finite numbers.")
    
    # Reshape to (1, 784) for the batch dimension
    X = arr.reshape(1, 784)
    
    # We will gather intermediate states manually for visualization
    intermediate_states = {}
    
    output = X
    for i, layer in enumerate(global_nn.layers):
        output = layer.forward(output)
        # Assuming layer class names are distinct enough
        layer_name = f"{layer.__class__.__name__}_{i}"
        intermediate_states[layer_name] = output[0].tolist()
        
    probs = output[0]
    prediction = int(np.argmax(probs))
    
    return PredictResponse(
        prediction=prediction,
        probabilities=probs.tolist(),
        intermediate_states=intermediate_states
    )


@router.post("/model/backprop", response_model=BackpropResponse, tags=["Model"])
async def backprop(request: BackpropRequest):
    """
    Educational endpoint to perform forward and backward pass on a temporary model clone
    to retrieve gradients without affecting the pretrained model.
    """
    arr = np.array(request.flat_array, dtype=np.float32)
    if arr.shape != (784,):
        raise HTTPException(status_code=422, detail="flat_array must have exactly 784 elements.")
    if not np.isfinite(arr).all():
        raise HTTPException(status_code=422, detail="flat_array must contain only finite numbers.")
    
    if not (0 <= request.target_class <= 9):
        raise HTTPException(status_code=422, detail="target_class must be between 0 and 9.")
    
    # 1. Clone the global_nn to avoid touching cached intermediate states or weights
    temp_nn = NeuralNetwork(seed=42) # Seed doesn't matter much since we overwrite weights
    for i, (orig_layer, temp_layer) in enumerate(zip(global_nn.layers, temp_nn.layers)):
        if hasattr(orig_layer, 'weights'):
            temp_layer.weights = orig_layer.weights.copy()
            temp_layer.biases = orig_layer.biases.copy()

    # 2. Forward pass
    X = arr.reshape(1, 784)
    intermediate_states = {}
    output = X
    for i, layer in enumerate(temp_nn.layers):
        output = layer.forward(output)
        layer_name = f"{layer.__class__.__name__}_{i}"
        intermediate_states[layer_name] = output[0].tolist()
        
    probs = output
    prediction = int(np.argmax(probs[0]))
    
    # 3. Compute loss
    y_one_hot = np.zeros((1, 10))
    y_one_hot[0, request.target_class] = 1
    
    loss = temp_nn.loss_fn.forward(probs, y_one_hot)
    
    # 4. Backward pass
    d_loss = temp_nn.loss_fn.backward()
    output_gradient = d_loss[0].tolist()
    temp_nn.backward(d_loss)
    
    # 5. Extract gradients
    gradients = {}
    for i, layer in enumerate(temp_nn.layers):
        if hasattr(layer, 'd_weights'):
            layer_name = f"{layer.__class__.__name__}_{i}"
            gradients[layer_name] = {
                "weights": layer.d_weights.tolist(),
                "biases": layer.d_biases.flatten().tolist()
            }

    return BackpropResponse(
        prediction=prediction,
        probabilities=probs[0].tolist(),
        loss=loss,
        output_gradient=output_gradient,
        gradients=gradients,
        intermediate_states=intermediate_states
    )



@router.post("/model/save", tags=["Model"])
async def save_model():
    """
    Save current model weights.
    """
    try:
        global_nn.save(WEIGHTS_PATH)
        return {"message": "Model saved successfully", "path": str(WEIGHTS_PATH)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/model/load", tags=["Model"])
async def load_model():
    """
    Load model weights.
    """
    if not WEIGHTS_PATH.exists():
        raise HTTPException(status_code=404, detail="No saved model weights found.")
        
    try:
        global_nn.load(WEIGHTS_PATH)
        return {"message": "Model loaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/model/summary", tags=["Model"])
async def model_summary():
    """
    Get the architecture of the neural network.
    """
    layers = []
    for layer in global_nn.layers:
        if hasattr(layer, 'weights'):
            layers.append({
                "type": layer.__class__.__name__,
                "input_size": layer.weights.shape[0],
                "output_size": layer.weights.shape[1]
            })
        else:
            layers.append({
                "type": layer.__class__.__name__
            })
            
    return {"architecture": layers}


@router.get("/model/weights", response_model=WeightsResponse, tags=["Model"])
async def get_weights():
    """
    Get the raw weights and biases of the neural network for visualization.
    """
    layers_data = []
    for i, layer in enumerate(global_nn.layers):
        if hasattr(layer, 'weights') and hasattr(layer, 'biases'):
            layers_data.append(
                LayerWeights(
                    layer_name=f"{layer.__class__.__name__}_{i}",
                    weights=layer.weights.tolist(),
                    biases=layer.biases.flatten().tolist()
                )
            )
            
    return WeightsResponse(layers=layers_data)
