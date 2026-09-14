import json, os
from typing import Any

def md(source: str) -> dict[str, Any]:
    return {"cell_type": "markdown", "metadata": {}, "source": [source]}

def code(source: str) -> dict[str, Any]:
    return {"cell_type": "code", "metadata": {}, "source": [source], "execution_count": None, "outputs": []}

cells: list[dict[str, Any]] = []

# ==================== TITLE ====================
cells.append(md("""# 🧠 Handwritten Digit Recognition using CNN (Deep Learning)
### **Academic Project — Built in Google Colab**

This project uses a **Convolutional Neural Network (CNN)** to recognize handwritten digits (0–9) from the **MNIST dataset** with **99%+ accuracy**.

**Technologies:** Python, TensorFlow, Keras, NumPy, Matplotlib, Seaborn, Scikit-learn

---"""))

# ==================== STEP 1 ====================
cells.append(md("""## 📦 Step 1 — Install & Import All Libraries

| Library | Purpose |
|---|---|
| **TensorFlow/Keras** | Build and train the neural network |
| **NumPy** | Numerical operations on arrays |
| **Matplotlib** | Plot graphs and display images |
| **Seaborn** | Beautiful confusion matrix heatmap |
| **Scikit-learn** | Evaluation metrics (precision, recall, F1) |"""))

cells.append(code("""# Step 1: Import all required libraries
import numpy as np                          # For numerical array operations
import matplotlib.pyplot as plt             # For plotting graphs and images
import seaborn as sns                       # For confusion matrix heatmap
import tensorflow as tf                     # Deep learning framework
from tensorflow import keras                # High-level neural network API
from tensorflow.keras import layers         # Neural network layers
from tensorflow.keras.utils import to_categorical  # One-hot encoding
from sklearn.metrics import classification_report, confusion_matrix  # Evaluation
import warnings
warnings.filterwarnings('ignore')           # Suppress unnecessary warnings

# Verify installation
print("✅ TensorFlow version:", tf.__version__)
print("✅ NumPy version:", np.__version__)
print("✅ All libraries imported successfully!")"""))

# ==================== STEP 2 ====================
cells.append(md("""## 📥 Step 2 — Load the MNIST Dataset

**What is MNIST?**
- A collection of **70,000 handwritten digit images** (digits 0 to 9)
- **60,000** images for training, **10,000** for testing
- Each image is **28×28 pixels** in **grayscale** (black & white)
- Built into Keras — **no manual download needed!**"""))

cells.append(code("""# Step 2: Load MNIST dataset directly from Keras
from tensorflow.keras.datasets import mnist

# Load data — automatically splits into train and test sets
(X_train, y_train), (X_test, y_test) = mnist.load_data()

# Print shapes of all arrays
print("=" * 50)
print("📊 DATASET SHAPES:")
print("=" * 50)
print(f"Training images (X_train): {X_train.shape}")   # (60000, 28, 28)
print(f"Training labels (y_train): {y_train.shape}")    # (60000,)
print(f"Testing images  (X_test):  {X_test.shape}")     # (10000, 28, 28)
print(f"Testing labels  (y_test):  {y_test.shape}")     # (10000,)
print(f"\\nTotal training samples: {len(X_train)}")
print(f"Total testing samples:  {len(X_test)}")
print(f"\\nPixel value range: {X_train.min()} to {X_train.max()}")

# Bar chart: class distribution (how many images per digit)
fig, ax = plt.subplots(figsize=(10, 4))
unique, counts = np.unique(y_train, return_counts=True)
colors = plt.cm.viridis(np.linspace(0.2, 0.9, 10))
ax.bar(unique, counts, color=colors, edgecolor='black')
ax.set_xlabel('Digit', fontsize=12)
ax.set_ylabel('Count', fontsize=12)
ax.set_title('📊 Class Distribution in Training Data', fontsize=14, fontweight='bold')
ax.set_xticks(range(10))
for i, (u, c) in enumerate(zip(unique, counts)):
    ax.text(u, c + 100, str(c), ha='center', fontweight='bold', fontsize=9)
plt.tight_layout()
plt.show()
print("✅ Dataset loaded successfully!")"""))

# ==================== STEP 3 ====================
cells.append(md("""## 🔍 Step 3 — Explore & Visualize the Data

**Why explore data?** Before building a model, we must understand what the data looks like. This helps us spot patterns, errors, and understand the problem better."""))

cells.append(code("""# Step 3: Visualize sample images from the dataset

# Display a 5x5 grid of 25 random training images
fig, axes = plt.subplots(5, 5, figsize=(10, 10))
fig.suptitle('📸 25 Random Training Samples', fontsize=16, fontweight='bold')
indices = np.random.choice(len(X_train), 25, replace=False)

for i, ax in enumerate(axes.flat):
    ax.imshow(X_train[indices[i]], cmap='gray')      # Show image in grayscale
    ax.set_title(f'Label: {y_train[indices[i]]}', fontsize=11, fontweight='bold')
    ax.axis('off')                                     # Hide axis ticks
plt.tight_layout()
plt.show()

# Zoom into one single image and show pixel values
print("\\n🔬 Zoomed-in view of a single digit:")
sample_idx = np.random.randint(0, len(X_train))
plt.figure(figsize=(6, 6))
plt.imshow(X_train[sample_idx], cmap='gray')
plt.title(f'Single Image — Label: {y_train[sample_idx]}', fontsize=14, fontweight='bold')
plt.colorbar(label='Pixel Intensity')
plt.show()

# Show what labels look like
print(f"\\nFirst 20 labels: {y_train[:20]}")
print("✅ Data exploration complete!")"""))

# ==================== STEP 4 ====================
cells.append(md("""## ⚙️ Step 4 — Preprocess the Data

Three critical preprocessing steps:

**1. Normalize (÷ 255):** Pixels range 0–255. We scale to 0–1 so the neural network learns faster.

**2. Reshape to (28,28,1):** CNN expects a channel dimension. `1` = grayscale.

**3. One-Hot Encode Labels:**
```
Label 3 → [0, 0, 0, 1, 0, 0, 0, 0, 0, 0]
Label 7 → [0, 0, 0, 0, 0, 0, 0, 1, 0, 0]
             0  1  2  3  4  5  6  7  8  9
```"""))

cells.append(code("""# Step 4: Preprocess the data

# Save original data for bonus step later
X_test_original = X_test.copy()
y_test_original = y_test.copy()

# 4a. Normalize pixel values from [0, 255] to [0, 1]
X_train = X_train.astype('float32') / 255.0   # Convert to float and normalize
X_test = X_test.astype('float32') / 255.0

# 4b. Reshape for CNN: add channel dimension (28,28) → (28,28,1)
X_train = X_train.reshape(-1, 28, 28, 1)      # -1 means keep the first dimension
X_test = X_test.reshape(-1, 28, 28, 1)

# 4c. One-hot encode labels: 3 → [0,0,0,1,0,0,0,0,0,0]
y_train = to_categorical(y_train, num_classes=10)
y_test = to_categorical(y_test, num_classes=10)

# Verify preprocessing
print("=" * 50)
print("📊 PREPROCESSED DATA SHAPES:")
print("=" * 50)
print(f"X_train: {X_train.shape}  |  Pixel range: [{X_train.min():.1f}, {X_train.max():.1f}]")
print(f"X_test:  {X_test.shape}  |  Pixel range: [{X_test.min():.1f}, {X_test.max():.1f}]")
print(f"y_train: {y_train.shape}  |  y_test: {y_test.shape}")
print(f"\\n📌 Example — One-hot encoded label:")
print(f"   Label vector: {y_train[0]}")
print(f"   This represents digit: {np.argmax(y_train[0])}")
print("\\n✅ Preprocessing complete!")"""))

# ==================== STEP 5 ====================
cells.append(md("""## 🏗️ Step 5 — Build the CNN Model

**What is a CNN?** A Convolutional Neural Network that automatically learns to detect patterns (edges, curves, shapes) in images.

```
INPUT (28×28×1)
    ↓
Conv2D(32) + BatchNorm → Detects edges and simple patterns
    ↓
MaxPooling2D → Shrinks image, keeps important features
    ↓
Conv2D(64) + BatchNorm → Detects complex patterns
    ↓
MaxPooling2D → Further compression
    ↓
Conv2D(128) → Detects high-level features
    ↓
Flatten → Converts 2D feature maps to 1D vector
    ↓
Dense(256) → Learns combinations of features
    ↓
Dropout(0.5) → Randomly disables 50% neurons (prevents overfitting)
    ↓
Dense(10, softmax) → Outputs probability for each digit (0–9)
```"""))

cells.append(code("""# Step 5: Build the CNN model using Keras Sequential API

model = keras.Sequential([
    # First Convolution Block: detect basic features (edges, corners)
    layers.Conv2D(32, (3, 3), activation='relu', input_shape=(28, 28, 1)),
    layers.BatchNormalization(),               # Stabilizes and speeds up training
    layers.MaxPooling2D((2, 2)),               # Reduce spatial dimensions by half

    # Second Convolution Block: detect more complex patterns
    layers.Conv2D(64, (3, 3), activation='relu'),
    layers.BatchNormalization(),
    layers.MaxPooling2D((2, 2)),

    # Third Convolution Block: detect high-level features
    layers.Conv2D(128, (3, 3), activation='relu'),

    # Flatten: convert 3D feature maps to 1D vector
    layers.Flatten(),

    # Fully Connected Layer: learn feature combinations
    layers.Dense(256, activation='relu'),

    # Dropout: randomly disable 50% neurons to prevent overfitting
    layers.Dropout(0.5),

    # Output Layer: 10 neurons (one per digit), softmax gives probabilities
    layers.Dense(10, activation='softmax')
])

# Print model architecture summary
print("=" * 60)
print("🏗️ CNN MODEL ARCHITECTURE")
print("=" * 60)
model.summary()

# Count parameters
total_params = model.count_params()
print(f"\\n📊 Total trainable parameters: {total_params:,}")
print("✅ Model built successfully!")"""))

# ==================== STEP 6 ====================
cells.append(md("""## ⚡ Step 6 — Compile the Model

| Component | Choice | Why |
|---|---|---|
| **Optimizer** | Adam | Adapts learning rate automatically, fast convergence |
| **Loss** | categorical_crossentropy | Standard for multi-class classification |
| **Metric** | Accuracy | Easy to understand performance measure |

**Callbacks** help automate training:
- **ReduceLROnPlateau**: Reduces learning rate when model stops improving
- **EarlyStopping**: Stops training early if no improvement (saves time)"""))

cells.append(code("""# Step 6: Compile the model and define training callbacks

# Compile: configure the learning process
model.compile(
    optimizer='adam',                        # Adam optimizer (adaptive learning rate)
    loss='categorical_crossentropy',         # Loss function for multi-class
    metrics=['accuracy']                     # Track accuracy during training
)

# Callback 1: Reduce learning rate when validation accuracy plateaus
reduce_lr = keras.callbacks.ReduceLROnPlateau(
    monitor='val_accuracy',                  # Watch validation accuracy
    patience=3,                              # Wait 3 epochs before reducing
    factor=0.5,                              # Multiply LR by 0.5
    min_lr=0.00001,                          # Don't go below this LR
    verbose=1
)

# Callback 2: Stop training early if no improvement
early_stopping = keras.callbacks.EarlyStopping(
    monitor='val_loss',                      # Watch validation loss
    patience=5,                              # Wait 5 epochs before stopping
    restore_best_weights=True,               # Keep the best model weights
    verbose=1
)

print("✅ Model compiled with Adam optimizer")
print("✅ Callbacks configured: ReduceLROnPlateau + EarlyStopping")"""))

# ==================== STEP 7 ====================
cells.append(md("""## 🚀 Step 7 — Train the Model

| Term | Meaning |
|---|---|
| **Epoch** | One complete pass through all 60,000 training images |
| **Batch Size** | 64 images processed at once before updating weights |
| **Validation Split** | 10% of training data reserved to monitor overfitting |
| **Overfitting** | Model memorizes training data but fails on new data |"""))

cells.append(code("""# Step 7: Train the model on training data

print("🚀 Training started...\\n")

history = model.fit(
    X_train, y_train,                        # Training data and labels
    epochs=20,                               # Maximum 20 passes through data
    batch_size=64,                           # Process 64 images at a time
    validation_split=0.1,                    # Use 10% for validation
    callbacks=[reduce_lr, early_stopping],   # Use our callbacks
    verbose=1                                # Show progress bar
)

# Training summary
print("\\n" + "=" * 50)
print("🎉 TRAINING COMPLETE!")
print("=" * 50)
best_val_acc = max(history.history['val_accuracy'])
print(f"Best Validation Accuracy: {best_val_acc * 100:.2f}%")
print(f"Total Epochs Trained: {len(history.history['loss'])}")"""))

# ==================== STEP 8 ====================
cells.append(md("""## 📈 Step 8 — Plot Training Results

- **If both curves are close and high** → Model is learning well ✅
- **If training accuracy >> validation accuracy** → Overfitting ⚠️
- **If both curves are low** → Underfitting (model too simple) ❌"""))

cells.append(code("""# Step 8: Plot training history — Accuracy and Loss curves

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

# Plot 1: Accuracy
ax1.plot(history.history['accuracy'], 'b-o', label='Training Accuracy', linewidth=2)
ax1.plot(history.history['val_accuracy'], 'r-s', label='Validation Accuracy', linewidth=2)
ax1.set_title('📈 Model Accuracy Over Epochs', fontsize=14, fontweight='bold')
ax1.set_xlabel('Epoch')
ax1.set_ylabel('Accuracy')
ax1.legend(fontsize=11)
ax1.grid(True, alpha=0.3)
ax1.set_ylim([0.95, 1.01])

# Plot 2: Loss
ax2.plot(history.history['loss'], 'b-o', label='Training Loss', linewidth=2)
ax2.plot(history.history['val_loss'], 'r-s', label='Validation Loss', linewidth=2)
ax2.set_title('📉 Model Loss Over Epochs', fontsize=14, fontweight='bold')
ax2.set_xlabel('Epoch')
ax2.set_ylabel('Loss')
ax2.legend(fontsize=11)
ax2.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()
print("✅ Training curves plotted!")"""))

# ==================== STEP 9 ====================
cells.append(md("""## 🧪 Step 9 — Evaluate on Test Data

The test set contains **10,000 images the model has NEVER seen**. This gives us the true performance measure."""))

cells.append(code("""# Step 9: Evaluate model performance on unseen test data

test_loss, test_accuracy = model.evaluate(X_test, y_test, verbose=0)

print("=" * 50)
print("🧪 TEST SET EVALUATION RESULTS")
print("=" * 50)
print(f"Test Accuracy: {test_accuracy * 100:.2f}%")
print(f"Test Loss:     {test_loss:.4f}")

if test_accuracy > 0.99:
    print("\\n🏆 OUTSTANDING! Accuracy above 99%!")
elif test_accuracy > 0.98:
    print("\\n🎉 EXCELLENT! Accuracy above 98%!")
else:
    print("\\n✅ Good result! Try more epochs or data augmentation to improve.")"""))

# ==================== STEP 10 ====================
cells.append(md("""## 🔮 Step 10 — Predict & Visualize Results

The model outputs **10 probabilities** (one per digit). We pick the digit with the **highest probability** as the prediction. Let's see how it performs on random test images!"""))

cells.append(code("""# Step 10: Make predictions and visualize results

# Predict all test images
y_pred_probs = model.predict(X_test, verbose=0)   # Get probabilities
y_pred = np.argmax(y_pred_probs, axis=1)           # Convert to class labels
y_true = np.argmax(y_test, axis=1)                 # Convert one-hot back to labels

# Display 4x4 grid of predictions
fig, axes = plt.subplots(4, 4, figsize=(12, 12))
fig.suptitle('🔮 Model Predictions on Test Images', fontsize=16, fontweight='bold')
indices = np.random.choice(len(X_test), 16, replace=False)

correct_count = 0
wrong_count = 0

for i, ax in enumerate(axes.flat):
    idx = indices[i]
    img = X_test[idx].reshape(28, 28)
    pred_label = y_pred[idx]
    true_label = y_true[idx]
    is_correct = pred_label == true_label

    ax.imshow(img, cmap='gray')
    color = '#2ecc71' if is_correct else '#e74c3c'
    symbol = '✅' if is_correct else '❌'
    ax.set_title(f'{symbol} Pred: {pred_label} | True: {true_label}',
                 fontsize=11, fontweight='bold', color=color)
    for spine in ax.spines.values():
        spine.set_color(color)
        spine.set_linewidth(3)
    ax.tick_params(left=False, bottom=False, labelleft=False, labelbottom=False)

plt.tight_layout()
plt.show()

# Overall statistics
total_correct = np.sum(y_pred == y_true)
total_wrong = len(y_true) - total_correct
print(f"\\n📊 Total Correct: {total_correct} / {len(y_true)}")
print(f"📊 Total Wrong:   {total_wrong} / {len(y_true)}")
print(f"📊 Accuracy:      {total_correct / len(y_true) * 100:.2f}%")"""))

# ==================== STEP 11 ====================
cells.append(md("""## 📊 Step 11 — Confusion Matrix & Classification Report

**Confusion Matrix:** A 10×10 grid where:
- **Rows** = Actual digit
- **Columns** = Predicted digit
- **Diagonal** = Correct predictions
- **Off-diagonal** = Mistakes (e.g., model predicted 4 but it was 9)"""))

cells.append(code("""# Step 11: Confusion Matrix and Classification Report

# Compute confusion matrix
cm = confusion_matrix(y_true, y_pred)

# Plot heatmap
plt.figure(figsize=(10, 8))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=range(10), yticklabels=range(10),
            linewidths=0.5, linecolor='gray')
plt.title('📊 Confusion Matrix — Handwritten Digit Recognition',
          fontsize=14, fontweight='bold')
plt.xlabel('Predicted Digit', fontsize=12)
plt.ylabel('Actual Digit', fontsize=12)
plt.tight_layout()
plt.show()

# Print classification report
print("\\n" + "=" * 60)
print("📋 DETAILED CLASSIFICATION REPORT")
print("=" * 60)
print(classification_report(y_true, y_pred,
                            target_names=[f'Digit {i}' for i in range(10)]))"""))

# ==================== STEP 12 ====================
cells.append(md("""## 💾 Step 12 — Save & Reload the Model

We save the trained model so it can be **reused later without retraining**. The `.h5` format stores the architecture, weights, and optimizer state."""))

cells.append(code("""# Step 12: Save and reload the trained model

# Save model to .h5 file
model.save('handwritten_digit_model.h5')

# Check file size
file_size = os.path.getsize('handwritten_digit_model.h5')
print(f"💾 Model saved as 'handwritten_digit_model.h5'")
print(f"📦 File size: {file_size / (1024*1024):.2f} MB")

# Reload the model
import os
loaded_model = tf.keras.models.load_model('handwritten_digit_model.h5')

# Verify reloaded model works
reload_loss, reload_acc = loaded_model.evaluate(X_test, y_test, verbose=0)
print(f"\\n🔄 Reloaded model test accuracy: {reload_acc * 100:.2f}%")
print("✅ Model saved and reloaded successfully!")"""))

# ==================== STEP 13 ====================
cells.append(md("""## 🌟 Step 13 (BONUS) — Predict Any Custom Digit Image

This function takes **any 28×28 image**, preprocesses it, and predicts the digit with a **confidence percentage**. This is how you'd use the model in a real application!"""))

cells.append(code("""# Step 13: Custom prediction function

def predict_digit(image_array, model):
    \\"\\"\\"
    Takes a 28x28 numpy array, preprocesses it, and predicts the digit.

    Args:
        image_array: numpy array of shape (28, 28) with pixel values 0-255
        model: trained Keras model

    Returns:
        predicted_digit (int), confidence (float)
    \\"\\"\\"
    # Step 1: Normalize pixel values to [0, 1]
    img = image_array.astype('float32') / 255.0

    # Step 2: Reshape to (1, 28, 28, 1) — batch of 1 image with channel dim
    img = img.reshape(1, 28, 28, 1)

    # Step 3: Get prediction probabilities
    predictions = model.predict(img, verbose=0)

    # Step 4: Get digit with highest probability
    predicted_digit = np.argmax(predictions[0])

    # Step 5: Get confidence percentage
    confidence = np.max(predictions[0]) * 100

    return predicted_digit, confidence


# Demonstrate with 5 random test images (using original unnormalized data)
print("🌟 BONUS: Custom Digit Prediction Demo\\n")
fig, axes = plt.subplots(1, 5, figsize=(15, 3))

for i, ax in enumerate(axes):
    idx = np.random.randint(0, len(X_test_original))
    img = X_test_original[idx]                          # Get original image
    true_label = y_test_original[idx]                   # Get true label

    pred, conf = predict_digit(img, model)              # Predict!

    ax.imshow(img, cmap='gray')
    color = '#2ecc71' if pred == true_label else '#e74c3c'
    ax.set_title(f'Pred: {pred} ({conf:.1f}%)\\nTrue: {true_label}',
                 fontsize=11, fontweight='bold', color=color)
    ax.axis('off')

plt.suptitle('🔮 Custom Prediction Results', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.show()

print("\\n✅ predict_digit() function is ready to use with any 28x28 image!")"""))

# ==================== FINAL SUMMARY ====================
cells.append(md("""---
## 🎓 Project Summary

| Item | Detail |
|---|---|
| **Project** | Handwritten Digit Recognition using CNN |
| **Dataset** | MNIST — 70,000 grayscale images (28×28 pixels) |
| **Model** | CNN with 3 Conv2D layers + BatchNorm + Dropout |
| **Optimizer** | Adam with ReduceLROnPlateau |
| **Expected Accuracy** | **99%+** on test set |
| **Technologies** | Python, TensorFlow, Keras, NumPy, Matplotlib, Seaborn, Scikit-learn |

### 📚 What We Learned:
1. How to load and preprocess image data (normalize, reshape, one-hot encode)
2. How to build a CNN with Conv2D, MaxPooling, BatchNorm, Dropout layers
3. How to train with callbacks (EarlyStopping, ReduceLROnPlateau)
4. How to evaluate using accuracy, confusion matrix, and classification report
5. How to save/load models and build a reusable prediction function

---
*Built as an academic project using Google Colab* 🚀"""))

# ==================== BUILD NOTEBOOK ====================
notebook = {
    "nbformat": 4,
    "nbformat_minor": 0,
    "metadata": {
        "colab": {"provenance": [], "gpuType": "T4"},
        "kernelspec": {"name": "python3", "display_name": "Python 3"},
        "language_info": {"name": "python"},
        "accelerator": "GPU"
    },
    "cells": cells
}

output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           "Handwritten_Digit_Recognition_CNN.ipynb")
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(notebook, f, indent=2, ensure_ascii=False)

print(f"✅ Notebook created: {output_path}")
print(f"📦 Total cells: {len(cells)} ({sum(1 for c in cells if c['cell_type']=='markdown')} markdown + {sum(1 for c in cells if c['cell_type']=='code')} code)")
