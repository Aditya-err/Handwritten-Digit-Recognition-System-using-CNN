"""
FastAPI application entry point.

Architecture:
- CORS configured to allow requests from the Vite dev server (localhost:5173)
- Routers are registered with a /api/v1 prefix
- Phase 1: only the /health endpoint is active
"""
import os
# Workaround for OMP: Error #15 when NumPy and PyTorch are both loaded on Windows.
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, dataset, model, cnn

# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Neural Network Visualizer API",
    description=(
        "Backend for the interactive Neural Network Digit Recognition Visualizer. "
        "Provides prediction, training, and model introspection endpoints."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS
# Allows the Vite frontend (localhost:5173) to call the API during development.
# In production this list should be tightened to the actual domain.
# ---------------------------------------------------------------------------
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",  # alternate dev port
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
API_PREFIX = "/api/v1"

app.include_router(health.router,  prefix=API_PREFIX)
app.include_router(dataset.router, prefix=API_PREFIX)
app.include_router(model.router, prefix=API_PREFIX)
app.include_router(cnn.router, prefix="/api/v1/cnn", tags=["cnn"])

# ---------------------------------------------------------------------------
# Root redirect
# ---------------------------------------------------------------------------
@app.get("/", include_in_schema=False)
async def root():
    return {
        "message": "Neural Network Visualizer API",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
