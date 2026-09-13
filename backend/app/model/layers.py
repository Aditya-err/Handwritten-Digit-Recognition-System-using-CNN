import numpy as np

class Dense:
    """
    Fully Connected (Dense) Layer.
    Computes: z = X \\cdot W + b
    """
    def __init__(self, input_size: int, output_size: int, seed: int | None = None):
        if seed is not None:
            np.random.seed(seed)
        
        # He initialization for ReLU activations works well
        limit = np.sqrt(2.0 / input_size)
        self.weights = np.random.randn(input_size, output_size) * limit
        self.biases = np.zeros((1, output_size))
        
        self.inputs = None
        self.d_weights = None
        self.d_biases = None

    def forward(self, inputs: np.ndarray) -> np.ndarray:
        """
        Forward pass.
        inputs shape: (batch_size, input_size)
        returns shape: (batch_size, output_size)
        """
        self.inputs = inputs
        return np.dot(inputs, self.weights) + self.biases

    def backward(self, d_out: np.ndarray) -> np.ndarray:
        """
        Backward pass.
        d_out shape: (batch_size, output_size)
        returns shape: (batch_size, input_size)
        """
        # Gradient with respect to weights and biases
        self.d_weights = np.dot(self.inputs.T, d_out)
        self.d_biases = np.sum(d_out, axis=0, keepdims=True)
        
        # Gradient with respect to inputs (to pass to previous layer)
        d_inputs = np.dot(d_out, self.weights.T)
        return d_inputs
