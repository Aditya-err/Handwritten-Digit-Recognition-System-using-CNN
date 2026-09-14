# Digit Recognition + Interactive Neural Network Visualizer

This project is an educational, interactive web application where users can draw handwritten digits and inspect exactly how neural networks process the image internally. By visualizing intermediate states, real gradients, and model architecture, it demystifies the "black box" of machine learning for beginners and students.

## Project Highlights

- Real MNIST digit recognition
- NumPy neural network from scratch
- Manual forward propagation
- Manual backpropagation
- Real gradient visualization
- Interactive network visualization
- Training dashboard
- PyTorch CNN comparison
- CNN feature-map visualization
- Dataset explorer
- Interactive learning section
- Architecture sandbox
- Dark/light theme
- Responsive interface
- FastAPI backend
- React frontend

## Demo / User Journey

This application is designed to be explored in a specific educational flow:

1. **Dataset**: Understand the raw MNIST dataset, view the class distribution, and see how a 28x28 image is flattened into 784 numerical inputs.
2. **Recognize**: Draw a digit on the canvas and see real-time side-by-side predictions from the NumPy Neural Network and the PyTorch CNN.
3. **Network**: Visualize the architecture, weights, and biases of the NumPy Neural Network layer-by-layer.
4. **Backprop**: Draw a digit, select a target class, and watch the math of backpropagation in real-time. Click specific weights to inspect their gradients and simulated updates.
5. **Training**: Train the NumPy neural network live in your browser and monitor real-time epoch, batch, loss, and accuracy metrics.
6. **CNN**: Watch how the CNN processes your drawing layer-by-layer through convolutions and max-pooling operations via interactive heatmaps.
7. **Learn**: Read concise, interactive lessons covering machine learning fundamentals, tied directly to the visualizations.
8. **Architecture**: Experiment with neural-network architecture concepts in a sandbox environment without modifying the production pretrained model.

## Screenshots

*Note: Screenshots can be added to this section after running the application locally.*

## Tech Stack

### Frontend
- **React** (with TypeScript)
- **Vite**
- **Tailwind CSS**
- **Canvas/SVG** (for custom, fast heatmap rendering)
- **Recharts** (for dataset and training metrics)
- **Lucide React** (for icons)

### Backend
- **Python 3.10+**
- **FastAPI**
- **NumPy**
- **PyTorch**

### Dataset
- **MNIST** (Modified National Institute of Standards and Technology)

## Architecture Documentation

```text
User
 ↓
React Frontend (Vite, TS)
 ↓
FastAPI REST API
 ↓
ML / Dataset Services
 ├── NumPy Neural Network
 ├── PyTorch CNN
 └── MNIST Dataset
```

**Responsibilities:**
- **Frontend (React)**: Handles interaction, drawing, data visualization, charts, and educational presentation.
- **Backend (Python)**: Handles image preprocessing, model inference, custom training logic, gradient computation, model state, and dataset operations.

## Model Architecture

### 1. NumPy Dense Network (Educational)
Implemented manually using NumPy for educational transparency:
- **Input**: 784
- **Dense 1**: 784 → 128
- **Activation 1**: ReLU
- **Dense 2**: 128 → 64
- **Activation 2**: ReLU
- **Dense 3**: 64 → 10
- **Output**: Softmax

### 2. PyTorch CNN (Baseline)
- **Input**: 1 × 28 × 28
- **Conv2D 1**: 1 → 8 (Kernel 3x3)
- **Activation**: ReLU
- **MaxPool 1**: 2x2
- **Conv2D 2**: 8 → 16 (Kernel 3x3)
- **Activation**: ReLU
- **MaxPool 2**: 2x2
- **Flatten**: 16 × 7 × 7 = 784
- **Linear**: 784 → 10
- **Output**: LogSoftmax

## Mathematics

The application demonstrates the following core operations:

- **Dense Layer**: `z = Wx + b`
- **ReLU Activation**: `ReLU(z) = max(0, z)`
- **Softmax**: `p_i = exp(z_i) / Σ exp(z_j)`
- **Cross Entropy Loss**: `L = -Σ y_i log(p_i)`
- **Output Gradient**: `dL/dz = p - y`
- **Gradient Descent**: `W_new = W_old - η * dW`

## Project Structure

```text
backend/
  app/
    api/        # FastAPI endpoints (dataset, model, cnn, health)
    dataset/    # MNIST loader and cache
    ml/         # NumPy Neural Network and PyTorch CNN definitions
    preprocessing/ # Image processing utilities
    schemas/    # Pydantic models for API validation
  tests/        # Pytest suite
  weights/      # Pretrained model artifacts

frontend/
  src/
    components/ # Reusable UI, Canvas, Visualizers
    hooks/      # React hooks
    pages/      # Page components (Dataset, Recognize, Network, etc.)
    services/   # API logic
    types/      # TypeScript interfaces
```

## Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend Setup

```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```
The FastAPI backend will start on `http://localhost:8000`.

### 2. Frontend Setup

In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
The frontend will start on `http://localhost:5173`. Open this URL in your browser.

## Model / Weights Information

The repository includes pretrained artifacts in `backend/weights/`:
- `model.npz`: NumPy network weights and biases.
- `cnn_model.pt`: PyTorch CNN state dict.

These pretrained models allow inference and visualization to work out-of-the-box without requiring the user to train a model first. Custom training output generated in the browser is completely separate and will not overwrite these production model artifacts.

## Training Information

The custom NumPy model supports live educational training within the browser. This training process uses the real MNIST dataset and generates real training metrics. The pretrained model is protected, and any custom training output remains separate, meaning your production application is always safe from destructive modifications.

## Testing & Verification

The project includes strict API validation, testing, and lifecycle management. Run these commands to verify the project status.

### Backend Tests
```bash
python -m pytest backend/tests/
```

### Frontend Checks
```bash
cd frontend
npm run lint
npm run build
```
