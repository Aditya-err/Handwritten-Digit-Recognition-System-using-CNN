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
