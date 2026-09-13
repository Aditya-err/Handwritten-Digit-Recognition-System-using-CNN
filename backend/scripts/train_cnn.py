import os
# Workaround for OMP: Error #15
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import sys
from pathlib import Path
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np

# Add backend dir to sys.path so we can import from app
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from app.model.cnn import SimpleCNN
from app.dataset.mnist_loader import load_mnist

def set_seed(seed=42):
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    np.random.seed(seed)

def main():
    set_seed(42)
    print("Loading MNIST dataset...")
    X_train, y_train = load_mnist(split="train", flat=False)
    X_test, y_test = load_mnist(split="test", flat=False)
    
    # We will use a smaller subset or full data. Let's just use full data as it's a small CNN.
    print(f"Data loaded. Train size: {X_train.shape}, Test size: {X_test.shape}")
    
    # Reshape from (N, 784) to (N, 1, 28, 28)
    X_train_tensor = torch.tensor(X_train, dtype=torch.float32).view(-1, 1, 28, 28)
    y_train_tensor = torch.tensor(y_train, dtype=torch.long)
    
    X_test_tensor = torch.tensor(X_test, dtype=torch.float32).view(-1, 1, 28, 28)
    y_test_tensor = torch.tensor(y_test, dtype=torch.long)
    
    model = SimpleCNN()
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    epochs = 5
    batch_size = 64
    
    print("Starting training...")
    for epoch in range(epochs):
        model.train()
        permutation = torch.randperm(X_train_tensor.size()[0])
        epoch_loss = 0.0
        
        for i in range(0, X_train_tensor.size()[0], batch_size):
            indices = permutation[i:i + batch_size]
            batch_x, batch_y = X_train_tensor[indices], y_train_tensor[indices]
            
            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item()
            
        print(f"Epoch {epoch+1}/{epochs} | Loss: {epoch_loss / (X_train_tensor.size()[0]/batch_size):.4f}")
        
    print("Evaluating...")
    model.eval()
    with torch.no_grad():
        outputs = model(X_test_tensor)
        _, predicted = torch.max(outputs.data, 1)
        total = y_test_tensor.size(0)
        correct = (predicted == y_test_tensor).sum().item()
        
    accuracy = 100 * correct / total
    print(f"Final Test Accuracy: {accuracy:.2f}%")
    
    weights_path = backend_dir / "weights" / "cnn_model.pt"
    weights_path.parent.mkdir(exist_ok=True)
    torch.save(model.state_dict(), weights_path)
    print(f"Saved pretrained weights to {weights_path}")

if __name__ == "__main__":
    main()
