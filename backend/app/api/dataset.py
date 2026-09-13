"""
dataset.py — Dataset API router.

Endpoints
---------
GET /dataset/info
    Returns metadata about the available MNIST archive.

GET /dataset/sample
    Returns N random sample images from the MNIST dataset.
    Query params:
        count  : int  (1–100, default 20)
        digit  : int  (0–9) | "all"   (default "all")
        split  : "train" | "test"    (default "train")

POST /preprocess
    Accept a base64 PNG, return the 28×28 processed image and metadata.
    Used by the frontend to show the user what the NN actually receives.
"""

from __future__ import annotations

import logging
from typing import Annotated, Literal

import numpy as np
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.dataset.mnist_loader import (
    get_dataset_info,
    get_class_distribution,
    load_mnist,
)
from app.preprocessing.image_processor import process_canvas_image, mnist_array_to_b64_png

logger = logging.getLogger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class DatasetInfoResponse(BaseModel):
    available: bool
    format: str = ""
    image_size: str = ""
    channels: str = ""
    num_classes: int = 0
    splits: dict = {}
    archive_path: str = ""


class SampleImage(BaseModel):
    index: int          # row index in the dataset
    label: int          # ground-truth digit (0–9)
    image_b64: str      # base64 PNG (28×28, inverted for display)


class SampleResponse(BaseModel):
    count: int
    split: str
    digit_filter: str
    samples: list[SampleImage]
    class_distribution: dict[int, int]


class PreprocessRequest(BaseModel):
    image_b64: str = Field(
        ...,
        description="Base64-encoded PNG from the HTML canvas (data-URI prefix optional).",
    )


class PreprocessResponse(BaseModel):
    thumbnail_b64: str          # 28×28 processed image for display
    flat_array: list[float]     # 784 normalised pixel values [0.0, 1.0]
    original_size: tuple[int, int]
    is_blank: bool
    pixel_stats: dict           # min, max, mean, nonzero_count


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_samples_for_digit(
    images: np.ndarray,
    labels: np.ndarray,
    digit: int | None,
    count: int,
    rng: np.random.Generator,
) -> list[tuple[int, int, np.ndarray]]:
    """
    Return up to `count` (global_index, label, flat_array) tuples.
    Filters by `digit` when provided.
    """
    if digit is not None:
        mask = labels == digit
        indices = np.where(mask)[0]
    else:
        indices = np.arange(len(labels))

    if len(indices) == 0:
        return []

    chosen = rng.choice(indices, size=min(count, len(indices)), replace=False)
    return [(int(i), int(labels[i]), images[i]) for i in chosen]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/dataset/info", response_model=DatasetInfoResponse, tags=["Dataset"])
async def dataset_info() -> DatasetInfoResponse:
    """
    Return metadata about the MNIST dataset archive.
    Does NOT load image pixels — fast response.
    """
    info = get_dataset_info()
    return DatasetInfoResponse(**{k: v for k, v in info.items() if k != "archive_path"},
                               archive_path=info.get("archive_path", ""))


@router.get("/dataset/sample", response_model=SampleResponse, tags=["Dataset"])
async def dataset_sample(
    count: Annotated[int, Query(ge=1, le=100, description="Number of samples to return")] = 20,
    digit: Annotated[str, Query(description='Digit to filter (0–9) or "all"')] = "all",
    split: Annotated[Literal["train", "test"], Query(description="Dataset split")] = "train",
) -> SampleResponse:
    """
    Return random MNIST sample images as base64 PNGs.

    Images are loaded fresh on each request from the first 5,000 rows of the
    split for speed (no caching in Phase 2 — Phase 8 will add a cache).
    The images are inverted for display (dark ink on light background).
    """
    # Parse digit filter
    digit_int: int | None = None
    if digit != "all":
        try:
            digit_int = int(digit)
            if digit_int not in range(10):
                raise ValueError
        except ValueError:
            raise HTTPException(
                status_code=422,
                detail=f"digit must be 0–9 or 'all', got {digit!r}",
            )

    # Load a manageable subset for quick API responses
    # (full 60k load is reserved for training in Phase 8)
    LOAD_SUBSET = 5_000
    try:
        images, labels = load_mnist(split=split, subset_size=LOAD_SUBSET, flat=True)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.exception("Failed to load MNIST for sample endpoint")
        raise HTTPException(status_code=500, detail=f"Dataset load error: {exc}")

    rng = np.random.default_rng(seed=42)  # Fixed seed → reproducible samples
    raw_samples = _get_samples_for_digit(images, labels, digit_int, count, rng)

    if not raw_samples:
        raise HTTPException(
            status_code=404,
            detail=f"No samples found for digit={digit!r} in {split} split.",
        )

    samples = [
        SampleImage(
            index=idx,
            label=lbl,
            image_b64=mnist_array_to_b64_png(arr),
        )
        for idx, lbl, arr in raw_samples
    ]

    class_dist = get_class_distribution(labels)

    return SampleResponse(
        count=len(samples),
        split=split,
        digit_filter=digit,
        samples=samples,
        class_distribution=class_dist,
    )


@router.post("/preprocess", response_model=PreprocessResponse, tags=["Preprocessing"])
async def preprocess_image(body: PreprocessRequest) -> PreprocessResponse:
    """
    Process a base64 PNG from the drawing canvas.

    Returns the 28×28 normalized array and a thumbnail PNG so the
    frontend can show the user what the neural network will receive.
    """
    try:
        result = process_canvas_image(body.image_b64)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error during image preprocessing")
        raise HTTPException(status_code=500, detail=f"Preprocessing error: {exc}")

    arr = result.flat_array
    nonzero = int(np.count_nonzero(arr > 0.05))
    is_blank = nonzero < 5

    return PreprocessResponse(
        thumbnail_b64=result.thumbnail_b64,
        flat_array=arr.tolist(),
        original_size=result.original_size,
        is_blank=is_blank,
        pixel_stats={
            "min": float(arr.min()),
            "max": float(arr.max()),
            "mean": float(arr.mean()),
            "nonzero_count": nonzero,
        },
    )
