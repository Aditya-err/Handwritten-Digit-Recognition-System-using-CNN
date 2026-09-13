"""
activations.py — Neural Network Activation Functions
"""
import numpy as np

class Activation:
    def forward(self, inputs: np.ndarray) -> np.ndarray:
        raise NotImplementedError

    def backward(self, d_out: np.ndarray) -> np.ndarray:
        raise NotImplementedError

class ReLU(Activation):
    def __init__(self):
        self.inputs = None

    def forward(self, inputs: np.ndarray) -> np.ndarray:
        """
        ReLU(x) = max(0, x)
        """
        self.inputs = inputs
        return np.maximum(0, inputs)

    def backward(self, d_out: np.ndarray) -> np.ndarray:
        """
        Derivative of ReLU is 1 if x > 0 else 0.
        """
        d_inputs = d_out.copy()
        d_inputs[self.inputs <= 0] = 0
        return d_inputs

class Softmax(Activation):
    def __init__(self):
        self.output = None

    def forward(self, inputs: np.ndarray) -> np.ndarray:
        """
        Softmax converts logits into probabilities.
        Includes numerical stability shift: shifted_logits = logits - max(logits).
        """
        # Shift inputs to prevent overflow in exp()
        shifted_inputs = inputs - np.max(inputs, axis=1, keepdims=True)
        exps = np.exp(shifted_inputs)
        
        # Calculate probabilities
        self.output = exps / np.sum(exps, axis=1, keepdims=True)
        return self.output

    def backward(self, d_out: np.ndarray) -> np.ndarray:
        """
        Backward pass for Softmax alone is complex (Jacobian matrix).
        However, when fused with Categorical Cross-Entropy, the combined gradient
        simplifies dramatically to (predictions - targets).
        
        Therefore, this backward() is generally bypassed in our network implementation
        which directly computes the fused gradient in the loss function.
        """
        raise NotImplementedError("Softmax backward is fused with CrossEntropyLoss for numerical stability.")
