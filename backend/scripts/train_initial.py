import sys
import os
import numpy as np
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.dataset.mnist_loader import load_mnist
from app.model.network import NeuralNetwork

def train_and_save():
    print("Loading full MNIST dataset...")
    X_train, y_train = load_mnist(split='train', subset_size=None)
    
    print("Initializing network...")
    nn = NeuralNetwork(seed=42)
    
    epochs = 10
    batch_size = 128
    learning_rate = 0.1
    num_samples = len(X_train)
    
    print(f"Training for {epochs} epochs...")
    for epoch in range(epochs):
        # Shuffle
        indices = np.random.permutation(num_samples)
        X_shuffled = X_train[indices]
        y_shuffled = y_train[indices]
        
        epoch_loss = 0
        batches = 0
        for i in range(0, num_samples, batch_size):
            X_batch = X_shuffled[i:i+batch_size]
            y_batch = y_shuffled[i:i+batch_size]
            
            # One-hot
            y_one_hot = np.zeros((len(y_batch), 10))
            y_one_hot[np.arange(len(y_batch)), y_batch] = 1
            
            # Forward
            probs = nn.forward(X_batch, training=True)
            loss = nn.loss_fn.forward(probs, y_one_hot)
            epoch_loss += loss
            batches += 1
            
            # Backward
            d_loss = nn.loss_fn.backward()
            nn.backward(d_loss)
            
            # Update
            nn.update_weights(learning_rate)
            
        print(f"Epoch {epoch+1}/{epochs}, Loss: {epoch_loss/batches:.4f}")
        
    weights_dir = Path(__file__).parent.parent.parent / "weights"
    weights_dir.mkdir(exist_ok=True)
    weights_path = weights_dir / "model.npz"
    
    nn.save(weights_path)
    print(f"Model saved to {weights_path}")
    
    # Evaluate
    X_test, y_test = load_mnist(split='test', subset_size=None)
    loss, acc = nn.evaluate(X_test, y_test)
    print(f"Test Accuracy: {acc:.4f}, Test Loss: {loss:.4f}")

if __name__ == "__main__":
    train_and_save()
