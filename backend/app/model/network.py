import numpy as np
from pathlib import Path

from .layers import Dense
from .activations import ReLU, Softmax
from .loss import CategoricalCrossEntropy

class NeuralNetwork:
    """
    Multilayer Perceptron Neural Network for MNIST Digit Recognition.
    Architecture: 784 -> Dense(128) -> ReLU -> Dense(64) -> ReLU -> Dense(10) -> Softmax
    """
    def __init__(self, seed: int | None = None):
        self.layers = [
            Dense(784, 128, seed=seed),
            ReLU(),
            Dense(128, 64, seed=seed + 1 if seed is not None else None),
            ReLU(),
            Dense(64, 10, seed=seed + 2 if seed is not None else None),
            Softmax()
        ]
        self.loss_fn = CategoricalCrossEntropy()
        
    def forward(self, X: np.ndarray, training: bool = True) -> np.ndarray:
        """
        Perform a forward pass through the network.
        
        Args:
            X: Input data of shape (batch_size, 784)
            training: Not strictly needed here as we don't have Dropout/BatchNorm,
                      but good practice to include.
                      
        Returns:
            Output predictions of shape (batch_size, 10)
        """
        output = X
        for layer in self.layers:
            output = layer.forward(output)
        return output
        
    def backward(self, d_loss: np.ndarray):
        """
        Perform a backward pass through the network.
        
        Args:
            d_loss: The gradient of the loss with respect to the output of the
                    layer *before* Softmax (i.e. logits). This is because Softmax
                    is fused with CategoricalCrossEntropy for stability.
        """
        # We start with the fused gradient d_loss, which is the gradient w.r.t the
        # output of the last Dense layer (the logits).
        # We skip the Softmax layer's backward method entirely.
        
        d_out = d_loss
        # Iterate backwards, skipping the last layer (Softmax)
        for layer in reversed(self.layers[:-1]):
            d_out = layer.backward(d_out)

    def update_weights(self, learning_rate: float):
        """
        Update the weights and biases of all Dense layers using Gradient Descent.
        """
        for layer in self.layers:
            if isinstance(layer, Dense):
                layer.weights -= learning_rate * layer.d_weights
                layer.biases -= learning_rate * layer.d_biases

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make predictions for input X.
        
        Returns:
            Predicted class indices, shape (batch_size,)
        """
        probs = self.forward(X, training=False)
        return np.argmax(probs, axis=1)

    def evaluate(self, X: np.ndarray, y: np.ndarray) -> tuple[float, float]:
        """
        Evaluate the model on dataset X, y.
        
        Args:
            X: Input data
            y: True labels (indices, not one-hot)
            
        Returns:
            Tuple of (loss, accuracy)
        """
        # Create one-hot encoded targets
        num_samples = len(y)
        y_one_hot = np.zeros((num_samples, 10))
        y_one_hot[np.arange(num_samples), y] = 1
        
        probs = self.forward(X, training=False)
        loss = self.loss_fn.forward(probs, y_one_hot)
        
        predictions = np.argmax(probs, axis=1)
        accuracy = np.mean(predictions == y)
        
        return loss, float(accuracy)

    def save(self, filepath: str | Path):
        """
        Save model weights and biases to a .npz file.
        """
        weights_dict = {}
        for i, layer in enumerate(self.layers):
            if isinstance(layer, Dense):
                weights_dict[f'w_{i}'] = layer.weights
                weights_dict[f'b_{i}'] = layer.biases
                
        np.savez(filepath, **weights_dict)

    def load(self, filepath: str | Path):
        """
        Load model weights and biases from a .npz file.
        """
        with np.load(filepath) as data:
            for i, layer in enumerate(self.layers):
                if isinstance(layer, Dense):
                    layer.weights = data[f'w_{i}']
                    layer.biases = data[f'b_{i}']
