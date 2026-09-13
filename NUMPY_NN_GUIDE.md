# NumPy Neural Network Guide

This document explains the mathematical foundations and implementation details of the custom NumPy-based Neural Network developed in Phase 3.

## Architecture Overview

The network is a Multilayer Perceptron (MLP) designed specifically for MNIST digit recognition (28x28 grayscale images).

**Architecture:**
- **Input:** 784 nodes (28x28 pixels flattened)
- **Hidden Layer 1:** 128 nodes, ReLU activation
- **Hidden Layer 2:** 64 nodes, ReLU activation
- **Output Layer:** 10 nodes, Softmax activation

## Mathematical Formulation

### 1. Dense (Fully Connected) Layer

**Forward Pass:**
For a given input matrix $X$ (shape: $N \times \text{in}$), weight matrix $W$ (shape: $\text{in} \times \text{out}$), and bias vector $b$ (shape: $1 \times \text{out}$):
$$ z = X \cdot W + b $$

**Backward Pass:**
Given the upstream gradient $\frac{\partial L}{\partial z}$:
$$ \frac{\partial L}{\partial W} = X^T \cdot \frac{\partial L}{\partial z} $$
$$ \frac{\partial L}{\partial b} = \sum_{i=1}^{N} \frac{\partial L}{\partial z_i} $$
$$ \frac{\partial L}{\partial X} = \frac{\partial L}{\partial z} \cdot W^T $$

### 2. ReLU Activation

**Forward Pass:**
$$ \text{ReLU}(z) = \max(0, z) $$

**Backward Pass:**
$$ \frac{\partial L}{\partial z} = \frac{\partial L}{\partial a} \odot \mathbb{I}(z > 0) $$

### 3. Fused Softmax and Categorical Cross-Entropy

Using standard backpropagation for Softmax and Cross-Entropy separately is computationally expensive and prone to numerical instability. Instead, we compute their **fused gradient**.

**Categorical Cross-Entropy (Forward):**
$$ L = -\frac{1}{N}\sum_{i=1}^{N} \sum_{c=1}^{C} y_{i,c} \log(\hat{y}_{i,c} + \epsilon) $$

**Fused Backward Pass:**
When combining the Jacobian of Softmax with the gradient of Categorical Cross-Entropy, many terms cancel out, resulting in the beautifully simple gradient with respect to the pre-activation logits $z$:
$$ \frac{\partial L}{\partial z} = \frac{1}{N} (\hat{y} - y) $$
Where $\hat{y}$ are the predicted probabilities and $y$ are the one-hot encoded true labels.

*Note on implementation:* In `app/model/network.py`, the `Softmax` layer's `backward()` method is intentionally bypassed. Instead, `CategoricalCrossEntropy.backward()` directly returns the gradient with respect to the logits, which is then passed to the last `Dense` layer.

## Weight Initialization

We use a variation of **He initialization** tailored for ReLU activations to prevent vanishing/exploding gradients during training:
$$ W \sim \mathcal{N}\left(0, \frac{2}{\text{in}}\right) $$

## Training and Numerical Stability

- **Log-Sum-Exp Trick:** Inside `Softmax.forward()`, we subtract the maximum logit before exponentiation to prevent overflow errors.
- **Epsilon in Log:** Inside `CategoricalCrossEntropy.forward()`, predictions are clipped by $\epsilon = 10^{-7}$ to avoid taking the log of zero.
- **Background Training:** The FastAPI training endpoint uses a background thread (`threading.Thread`) with a shared `TrainState` object to ensure the event loop is never blocked during training, and memory access remains thread-safe for reading status.
