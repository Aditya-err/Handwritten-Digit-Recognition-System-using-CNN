"""
mnist_loader.py — MNIST dataset loader.

Format confirmed by inspection:
    archive.zip/
        mnist_train.csv  — 60,000 rows × 785 cols (label, 1x1…28x28)
        mnist_test.csv   — 10,000 rows × 785 cols

Pixel values: uint8 in [0, 255].
Label column: integer in [0, 9].

Public API
----------
load_mnist(subset_size, split)
    Returns (images, labels) as float32 numpy arrays.
    images : shape (N, 784) or (N, 28, 28) depending on `flat`
    labels : shape (N,) int64

get_class_distribution(labels)
    Returns dict {digit: count} for reporting.
"""

from __future__ import annotations

import io
import logging
import zipfile
from pathlib import Path
from typing import Literal

import numpy as np

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
# archive.zip sits one level above the backend/ directory.
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
_ARCHIVE_PATH = _PROJECT_ROOT / "archive.zip"

_CSV_NAMES: dict[str, str] = {
    "train": "mnist_train.csv",
    "test":  "mnist_test.csv",
}

# Expected sizes — used for validation warnings, not hard limits.
_EXPECTED_SIZES = {"train": 60_000, "test": 10_000}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _load_csv_from_zip(
    split: Literal["train", "test"],
    subset_size: int | None,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Load one CSV split from archive.zip.

    Returns
    -------
    images : float32 ndarray, shape (N, 784), values in [0.0, 1.0]
    labels : int64 ndarray, shape (N,)
    """
    csv_name = _CSV_NAMES[split]
    logger.info("Loading MNIST %s from %s:%s", split, _ARCHIVE_PATH.name, csv_name)

    with zipfile.ZipFile(_ARCHIVE_PATH, "r") as zf:
        with zf.open(csv_name) as raw:
            # Read into an in-memory buffer so numpy can parse it directly.
            buf = io.BytesIO(raw.read())

    # Skip the header row, read only the first (subset_size + 1) rows when
    # a subset is requested — avoids loading the full CSV into RAM.
    max_rows = subset_size if subset_size is not None else None

    data = np.genfromtxt(
        buf,
        delimiter=",",
        skip_header=1,
        max_rows=max_rows,
        dtype=np.float32,
    )

    # np.genfromtxt returns a 1-D array when max_rows=1 (single row).
    # Ensure it is always 2-D: (N, 785)
    if data.ndim == 1:
        data = data.reshape(1, -1)

    # Column layout: [label, pixel_0, pixel_1, …, pixel_783]
    labels: np.ndarray = data[:, 0].astype(np.int64)
    images: np.ndarray = data[:, 1:]   # shape (N, 784)

    if images.shape[1] != 784:
        raise ValueError(
            f"Expected 784 pixel columns, got {images.shape[1]}. "
            "The archive.zip format may have changed."
        )

    # Normalise from [0, 255] → [0.0, 1.0]
    images = images / 255.0

    expected = _EXPECTED_SIZES[split]
    if subset_size is None and len(labels) != expected:
        logger.warning(
            "Expected %d rows for %s split, loaded %d.",
            expected, split, len(labels),
        )

    logger.info("Loaded %d samples (split=%s).", len(labels), split)
    return images, labels


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def load_mnist(
    *,
    split: Literal["train", "test"] = "train",
    subset_size: int | None = None,
    flat: bool = True,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Load MNIST data from archive.zip.

    Parameters
    ----------
    split : "train" | "test"
        Which CSV to load.
    subset_size : int | None
        If given, load only the first `subset_size` samples.
        Useful for fast development/testing.
        None (default) → load the full split.
    flat : bool
        True  → images shape (N, 784)  — format expected by the NumPy NN.
        False → images shape (N, 28, 28) — useful for visualisation / CNN.

    Returns
    -------
    images : float32 ndarray, values in [0.0, 1.0]
    labels : int64 ndarray

    Raises
    ------
    FileNotFoundError
        When archive.zip does not exist at the expected path.
    ValueError
        When the CSV is malformed or has unexpected column count.
    RuntimeError
        Wraps any other load failure with a helpful message.
    """
    if not _ARCHIVE_PATH.exists():
        raise FileNotFoundError(
            f"MNIST archive not found at {_ARCHIVE_PATH}. "
            "Place archive.zip in the project root, or ensure the path is correct."
        )

    try:
        images, labels = _load_csv_from_zip(split=split, subset_size=subset_size)
    except (KeyError, zipfile.BadZipFile, ValueError):
        raise
    except Exception as exc:
        raise RuntimeError(f"Failed to load MNIST {split} split: {exc}") from exc

    if not flat:
        # Reshape flat 784-vector → 28×28 pixel grid
        images = images.reshape(-1, 28, 28)

    return images, labels


def get_class_distribution(labels: np.ndarray) -> dict[int, int]:
    """
    Return per-digit sample count.

    Parameters
    ----------
    labels : int64 ndarray, shape (N,)

    Returns
    -------
    {0: count_0, 1: count_1, …, 9: count_9}
    """
    unique, counts = np.unique(labels, return_counts=True)
    return {int(k): int(v) for k, v in zip(unique, counts)}


def get_dataset_info() -> dict:
    """
    Return metadata about the available dataset without loading all pixels.
    Uses only the CSV row counts (fast).
    """
    if not _ARCHIVE_PATH.exists():
        return {"available": False, "archive_path": str(_ARCHIVE_PATH)}

    info: dict = {
        "available": True,
        "archive_path": str(_ARCHIVE_PATH),
        "format": "Kaggle CSV (label + 784 pixel columns, uint8 0-255)",
        "image_size": "28x28",
        "channels": "grayscale",
        "num_classes": 10,
        "splits": {},
    }

    with zipfile.ZipFile(_ARCHIVE_PATH, "r") as zf:
        for split, csv_name in _CSV_NAMES.items():
            zi = zf.getinfo(csv_name)
            info["splits"][split] = {
                "filename": csv_name,
                "compressed_bytes": zi.compress_size,
                "uncompressed_bytes": zi.file_size,
                # Estimate row count from known sizes (exact counts from earlier inspection)
                "expected_samples": _EXPECTED_SIZES[split],
            }

    return info
