"""
Pydantic schemas for the Neural Network Visualizer API.
Phase 1: Base schemas only (health check).
Later phases will add prediction, training, and dataset schemas.
"""
from pydantic import BaseModel
from typing import Any


class HealthResponse(BaseModel):
    status: str
    version: str
    message: str
    backend: str
    models_loaded: dict[str, bool]


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None


class TrainConfigRequest(BaseModel):
    batch_size: int = 128
    epochs: int = 5
    learning_rate: float = 0.1
    subset_size: int | None = None
    validation_split: float = 0.1
    seed: int | None = 42


class TrainStatusResponse(BaseModel):
    status: str  # 'idle', 'training', 'completed', 'failed'
    epoch: int
    total_epochs: int
    batch: int
    total_batches: int
    loss: float
    accuracy: float
    val_loss: float | None = None
    val_accuracy: float | None = None
    error: str | None = None
    history: list[dict[str, Any]] = []


class PredictRequest(BaseModel):
    flat_array: list[float]  # 784 elements [0.0, 1.0]


class PredictResponse(BaseModel):
    prediction: int
    probabilities: list[float]
    intermediate_states: dict[str, list[float]] | None = None


class LayerWeights(BaseModel):
    layer_name: str
    weights: list[list[float]]
    biases: list[float]


class WeightsResponse(BaseModel):
    layers: list[LayerWeights]


class CNNSummaryResponse(BaseModel):
    architecture: str
    parameter_count: int
    model_type: str
    input_shape: list[int]
    output_classes: int


class BackpropRequest(BaseModel):
    flat_array: list[float]
    target_class: int


class BackpropResponse(BaseModel):
    prediction: int
    probabilities: list[float]
    loss: float
    output_gradient: list[float]
    gradients: dict[str, dict[str, list[Any]]]
    intermediate_states: dict[str, list[float]]
