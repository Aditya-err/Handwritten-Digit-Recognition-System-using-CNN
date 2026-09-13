import torch
import torch.nn as nn
import torch.nn.functional as F

class SimpleCNN(nn.Module):
    def __init__(self):
        super(SimpleCNN, self).__init__()
        # Input: 1 x 28 x 28
        self.conv1 = nn.Conv2d(in_channels=1, out_channels=8, kernel_size=3, padding=1)
        self.pool1 = nn.MaxPool2d(kernel_size=2, stride=2)
        # After pool1: 8 x 14 x 14
        
        self.conv2 = nn.Conv2d(in_channels=8, out_channels=16, kernel_size=3, padding=1)
        self.pool2 = nn.MaxPool2d(kernel_size=2, stride=2)
        # After pool2: 16 x 7 x 7
        
        self.fc = nn.Linear(16 * 7 * 7, 10)
        
    def forward(self, x, return_intermediates=False):
        """
        Forward pass.
        If return_intermediates is True, returns a tuple: (logits, intermediates_dict)
        where intermediates_dict contains tensors useful for visualization.
        """
        intermediates = {}
        intermediates["input"] = x.detach().cpu().numpy()
        
        # Block 1
        c1 = self.conv1(x)
        a1 = F.relu(c1)
        intermediates["conv1_activation"] = a1.detach().cpu().numpy()
        
        p1 = self.pool1(a1)
        intermediates["pool1_output"] = p1.detach().cpu().numpy()
        
        # Block 2
        c2 = self.conv2(p1)
        a2 = F.relu(c2)
        intermediates["conv2_activation"] = a2.detach().cpu().numpy()
        
        p2 = self.pool2(a2)
        intermediates["pool2_output"] = p2.detach().cpu().numpy()
        
        # Flatten
        flat = p2.view(-1, 16 * 7 * 7)
        intermediates["flattened"] = flat.detach().cpu().numpy()
        
        # FC
        logits = self.fc(flat)
        intermediates["logits"] = logits.detach().cpu().numpy()
        
        # Probabilities
        probs = F.softmax(logits, dim=1)
        intermediates["probabilities"] = probs.detach().cpu().numpy()
        
        if return_intermediates:
            return logits, intermediates
        return logits

def get_cnn_summary():
    model = SimpleCNN()
    return {
        "architecture": "1x28x28 -> Conv2D(1,8,3x3,p=1) -> ReLU -> MaxPool(2) -> Conv2D(8,16,3x3,p=1) -> ReLU -> MaxPool(2) -> Flatten -> Linear(16*7*7, 10)",
        "parameter_count": sum(p.numel() for p in model.parameters()),
        "model_type": "PyTorch CNN",
        "input_shape": [1, 1, 28, 28],
        "output_classes": 10
    }
