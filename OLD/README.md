# 🧠 Handwritten Digit Recognition using CNN (Deep Learning)

### **Academic Project Built in Google Colab**

This project uses a **Convolutional Neural Network (CNN)** to recognize handwritten digits (0-9) from the **MNIST dataset** with **99%+ accuracy**.

**Technologies:** Python, TensorFlow, Keras, NumPy, Matplotlib, Seaborn, Scikit-learn

---

## 🛠️ Step 1: Install & Import All Libraries

| Library | Purpose |
|---|---|
| **TensorFlow/Keras** | Build and train the neural network |
| **NumPy** | Numerical operations on arrays |
| **Matplotlib** | Plot graphs and display images |
| **Seaborn** | Beautiful confusion matrix heatmap |
| **Scikit-learn** | Evaluation metrics (precision, recall, F1) |

## 📊 Step 2: Load the MNIST Dataset

**What is MNIST?**
- A collection of **70,000 handwritten digit images** (digits 0 to 9)
- **60,000** images for training, **10,000** for testing
- Each image is **28x28 pixels** in **grayscale** (black & white)
- Built into Keras — **no manual download needed!**

## 🔍 Step 3: Explore & Visualize the Data

**Why explore data?** Before building a model, we must understand what the data looks like. This helps us spot patterns, errors, and understand the problem better.

## 🧹 Step 4: Preprocess the Data

Three critical preprocessing steps:

**1. Normalize (÷ 255):** Pixels range 0-255. We scale to 0-1 so the neural network learns faster.

**2. Reshape to (28,28,1):** CNN expects a channel dimension. `1` = grayscale.

**3. One-Hot Encode Labels:**
```
Label 3 -> [0, 0, 0, 1, 0, 0, 0, 0, 0, 0]
Label 7 -> [0, 0, 0, 0, 0, 0, 0, 1, 0, 0]
             0  1  2  3  4  5  6  7  8  9
```

## 🏗️ Step 5: Build the CNN Model

**What is a CNN?** A Convolutional Neural Network that automatically learns to detect patterns (edges, curves, shapes) in images.

```
INPUT (28x28x1)
    ⬇️
Conv2D(32) + BatchNorm — Detects edges and simple patterns
    ⬇️
MaxPooling2D — Shrinks image, keeps important features
    ⬇️
Conv2D(64) + BatchNorm — Detects complex patterns
    ⬇️
MaxPooling2D — Further compression
    ⬇️
Conv2D(128) — Detects high-level features
    ⬇️
Flatten — Converts 2D feature maps to 1D vector
    ⬇️
Dense(256) — Learns combinations of features
    ⬇️
Dropout(0.5) — Randomly disables 50% neurons (prevents overfitting)
    ⬇️
Dense(10, softmax) — Outputs probability for each digit (0-9)
```

## ⚙️ Step 6: Compile the Model

| Component | Choice | Why |
|---|---|---|
| **Optimizer** | Adam | Adapts learning rate automatically, fast convergence |
| **Loss** | categorical_crossentropy | Standard for multi-class classification |
| **Metric** | Accuracy | Easy to understand performance measure |

**Callbacks** help automate training:
- **ReduceLROnPlateau**: Reduces learning rate when model stops improving
- **EarlyStopping**: Stops training early if no improvement (saves time)

## 🏋️‍♂️ Step 7: Train the Model

| Term | Meaning |
|---|---|
| **Epoch** | One complete pass through all 60,000 training images |
| **Batch Size** | 64 images processed at once before updating weights |
| **Validation Split** | 10% of training data reserved to monitor overfitting |
| **Overfitting** | Model memorizes training data but fails on new data |

## 📈 Step 8: Plot Training Results

- **If both curves are close and high** -> Model is learning well ✅
- **If training accuracy >> validation accuracy** -> Overfitting ❌
- **If both curves are low** -> Underfitting (model too simple) ❌

## 🧪 Step 9: Evaluate on Test Data

The test set contains **10,000 images the model has NEVER seen**. This gives us the true performance measure.

## 🎯 Step 10: Predict & Visualize Results

The model outputs **10 probabilities** (one per digit). We pick the digit with the **highest probability** as the prediction. Let's see how it performs on random test images!

## 🧩 Step 11: Confusion Matrix & Classification Report

**Confusion Matrix:** A 10x10 grid where:
- **Rows** = Actual digit
- **Columns** = Predicted digit
- **Diagonal** = Correct predictions
- **Off-diagonal** = Mistakes (e.g., model predicted 4 but it was 9)

## 💾 Step 12: Save & Reload the Model

We save the trained model so it can be **reused later without retraining**. The `.h5` format stores the architecture, weights, and optimizer state.

## 🖼️ Step 13 (BONUS): Predict Any Custom Digit Image

This function takes **any 28x28 image**, preprocesses it, and predicts the digit with a **confidence percentage**. This is how you'd use the model in a real application!

---

## 📝 Project Summary

| Item | Detail |
|---|---|
| **Project** | Handwritten Digit Recognition using CNN |
| **Dataset** | MNIST — 70,000 grayscale images (28x28 pixels) |
| **Model** | CNN with 3 Conv2D layers + BatchNorm + Dropout |
| **Optimizer** | Adam with ReduceLROnPlateau |
| **Expected Accuracy** | **99%+** on test set |
| **Technologies** | Python, TensorFlow, Keras, NumPy, Matplotlib, Seaborn, Scikit-learn |

### 🎓 What We Learned:
1. How to load and preprocess image data (normalize, reshape, one-hot encode)
2. How to build a CNN with Conv2D, MaxPooling, BatchNorm, Dropout layers
3. How to train with callbacks (EarlyStopping, ReduceLROnPlateau)
4. How to evaluate using accuracy, confusion matrix, and classification report
5. How to save/load models and build a reusable prediction function

---
*Built as an academic project using Google Colab*
