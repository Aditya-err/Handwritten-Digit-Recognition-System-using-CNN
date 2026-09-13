"""
Health check router.
GET /health — returns backend status and which models are ready.
"""
from fastapi import APIRouter
from app.schemas.models import HealthResponse

router = APIRouter()

APP_VERSION = "1.0.0"


@router.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check() -> HealthResponse:
    """
    Returns the health status of the backend.

    - `status`: "ok" when the server is running normally.
    - `models_loaded`: which ML models have been loaded into memory.

    Phase 1: models_loaded will always be False until Phase 3/4.
    """
    return HealthResponse(
        status="ok",
        version=APP_VERSION,
        message="Neural Network Visualizer backend is running.",
        backend="FastAPI + NumPy + PyTorch",
        # Phase 1: models not yet implemented — honest status.
        models_loaded={
            "numpy_nn": False,
            "pytorch_cnn": False,
        },
    )
