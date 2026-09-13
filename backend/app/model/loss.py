import numpy as np

class CategoricalCrossEntropy:
    """
    Categorical Cross-Entropy Loss with fused backward pass for Softmax.
    """
    def __init__(self, epsilon: float = 1e-7):
        self.epsilon = epsilon
        self.y_pred = None
        self.y_true = None

    def forward(self, y_pred: np.ndarray, y_true: np.ndarray) -> float:
        """
        Computes the Categorical Cross-Entropy loss.
        
        Args:
            y_pred: Predictions (probabilities) from Softmax. Shape: (batch_size, num_classes)
            y_true: One-hot encoded ground truth. Shape: (batch_size, num_classes)
            
        Returns:
            Scalar loss (mean over the batch).
        """
        self.y_pred = y_pred
        self.y_true = y_true
        
        # Clip to prevent log(0)
        y_pred_clipped = np.clip(y_pred, self.epsilon, 1.0 - self.epsilon)
        
        # Compute loss
        # np.sum(y_true * -np.log(y_pred_clipped), axis=1) calculates loss per sample
        batch_losses = -np.sum(y_true * np.log(y_pred_clipped), axis=1)
        
        return float(np.mean(batch_losses))

    def backward(self) -> np.ndarray:
        """
        Computes the fused gradient of Categorical Cross-Entropy AND Softmax.
        This provides a much simpler and more numerically stable gradient:
        dL/dz = 1/N * (y_pred - y_true)
        
        Returns:
            Gradient with respect to the input (logits) of the Softmax layer.
        """
        samples = self.y_pred.shape[0]
        # Fused gradient for Softmax + CrossEntropy
        return (self.y_pred - self.y_true) / samples
