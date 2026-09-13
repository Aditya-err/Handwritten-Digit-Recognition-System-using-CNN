import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException
import torch

from app.schemas.models import PredictRequest, PredictResponse, CNNSummaryResponse
from app.model.cnn import SimpleCNN, get_cnn_summary

logger = logging.getLogger(__name__)
router = APIRouter()

CNN_WEIGHTS_PATH = Path(__file__).parent.parent.parent / "weights" / "cnn_model.pt"

# Load the CNN lazily or globally
global_cnn = None

def get_model():
    global global_cnn
    if global_cnn is None:
        if not CNN_WEIGHTS_PATH.exists():
            raise FileNotFoundError(f"CNN weights not found at {CNN_WEIGHTS_PATH}. Please run the training script first.")
        global_cnn = SimpleCNN()
        global_cnn.load_state_dict(torch.load(CNN_WEIGHTS_PATH, map_location=torch.device('cpu')))
        global_cnn.eval()
    return global_cnn

@router.post("/predict", response_model=PredictResponse)
async def predict_digit(request: PredictRequest):
    """
    Predict digit using the PyTorch CNN.
    """
    if len(request.flat_array) != 784:
        raise HTTPException(status_code=400, detail="Input must be exactly 784 float values.")

    model = get_model()
    
    # Reshape the 1D input into a 1x1x28x28 tensor
    try:
        x_tensor = torch.tensor(request.flat_array, dtype=torch.float32).view(1, 1, 28, 28)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid tensor shape: {e}")
        
    with torch.no_grad():
        logits, intermediates = model(x_tensor, return_intermediates=True)
        
    predicted_digit = int(torch.argmax(logits, dim=1).item())
    probabilities = intermediates["probabilities"][0].tolist()
    
    # We want to package intermediate_states cleanly (converting lists to lists for json)
    intermediate_states = {}
    for k, v in intermediates.items():
        # Flatten everything for now, or just send lists of floats
        intermediate_states[k] = v.flatten().tolist()
        
    return PredictResponse(
        prediction=predicted_digit,
        probabilities=probabilities,
        intermediate_states=intermediate_states
    )

@router.get("/summary", response_model=CNNSummaryResponse)
async def get_summary():
    """
    Get PyTorch CNN architecture info.
    """
    return CNNSummaryResponse(**get_cnn_summary())
