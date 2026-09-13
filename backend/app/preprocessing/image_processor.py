"""
image_processor.py — Canvas PNG → 28×28 normalized array.

Handles the user-drawing flow:
    1. Accept a base64-encoded PNG string (from the HTML canvas).
    2. Decode to a PIL Image.
    3. Handle transparency / alpha channel correctly:
       - White background composite (canvas bg is typically white or dark).
       - Invert if needed so the digit is bright on a dark background
         — matching the MNIST convention (white digit on black background).
    4. Convert to grayscale (L mode).
    5. Resize to 28×28 using LANCZOS (best quality for downscaling).
    6. Normalize pixel values to float32 in [0.0, 1.0].
    7. Return as flat numpy array shape (784,) for the NumPy NN,
       plus a base64 PNG thumbnail for the frontend to display.

MNIST convention
----------------
    - Black background (pixel = 0.0)
    - White/bright digit (pixel → 1.0)

Canvas convention
-----------------
    - White background
    - Dark (black) strokes

So we INVERT the canvas image before normalising so it matches MNIST.

Public API
----------
    process_canvas_image(b64_png: str) -> ProcessedImage
    array_to_b64_png(arr: np.ndarray) -> str   # 28×28 float32 → PNG
"""

from __future__ import annotations

import base64
import io
import logging
from dataclasses import dataclass

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Data transfer object
# ---------------------------------------------------------------------------

@dataclass
class ProcessedImage:
    """Result of processing one canvas drawing."""
    flat_array: np.ndarray      # shape (784,), float32, values [0.0, 1.0]
    grid_array: np.ndarray      # shape (28, 28), float32, values [0.0, 1.0]
    thumbnail_b64: str          # base64 PNG of the 28×28 image for display
    original_size: tuple[int, int]  # (width, height) of the canvas image


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _b64_to_image(b64_string: str) -> Image.Image:
    """
    Decode a base64 string to a PIL Image.
    Strips the data-URI prefix (data:image/png;base64,...) if present.
    """
    if "," in b64_string:
        # Strip  "data:image/png;base64,"
        b64_string = b64_string.split(",", 1)[1]

    try:
        raw_bytes = base64.b64decode(b64_string)
    except Exception as exc:
        raise ValueError(f"Invalid base64 string: {exc}") from exc

    try:
        img = Image.open(io.BytesIO(raw_bytes))
        img.load()  # Force full decode — catches truncated files early.
    except Exception as exc:
        raise ValueError(f"Cannot decode image: {exc}") from exc

    return img


def _composite_on_white(img: Image.Image) -> Image.Image:
    """
    If the image has an alpha channel, composite it onto a white background.
    This preserves semi-transparent strokes correctly.
    """
    if img.mode in ("RGBA", "LA"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "RGBA":
            background.paste(img, mask=img.split()[3])  # alpha channel as mask
        else:
            background.paste(img.convert("RGB"), mask=img.split()[1])
        return background
    return img


def _is_blank(arr: np.ndarray, blank_threshold: float = 0.02) -> bool:
    """
    Return True if the normalised array has essentially no content
    (all pixels < threshold after inversion).
    """
    return float(arr.max()) < blank_threshold


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def process_canvas_image(b64_png: str) -> ProcessedImage:
    """
    Convert a base64 canvas PNG into a 28×28 float32 array ready for the NN.

    Steps
    -----
    1. Decode base64 → PIL Image
    2. Composite alpha onto white background
    3. Convert to grayscale
    4. Resize to 28×28 (LANCZOS)
    5. Normalize to [0.0, 1.0]
    6. Invert so digit = bright, background = dark  (MNIST convention)
    7. Clip to [0, 1] to guard against rounding artefacts
    8. Build thumbnail PNG for frontend preview

    Parameters
    ----------
    b64_png : str
        Base64-encoded PNG image (may include data-URI prefix).

    Returns
    -------
    ProcessedImage

    Raises
    ------
    ValueError
        For invalid base64, undecodable image, or completely blank input.
    """
    # 1. Decode
    img = _b64_to_image(b64_png)
    original_size = img.size  # (width, height)
    logger.debug("Canvas image decoded: size=%s, mode=%s", original_size, img.mode)

    # 2. Composite alpha onto white background
    img = _composite_on_white(img)

    # 3. Grayscale
    img = img.convert("L")

    # 4. Resize to 28×28 — use LANCZOS for best downsampling quality
    img_28 = img.resize((28, 28), Image.LANCZOS)

    # 5. Normalize [0, 255] → [0.0, 1.0]
    arr = np.array(img_28, dtype=np.float32) / 255.0

    # 6. Invert: canvas has white bg + dark strokes; MNIST has black bg + bright strokes.
    #    After inversion: strokes become bright (→ 1.0), background becomes dark (→ 0.0).
    arr = 1.0 - arr

    # 7. Clip to guard against any floating-point artefacts
    arr = np.clip(arr, 0.0, 1.0)

    # Blank check — warn but do NOT raise (the model can handle a blank input,
    # it will just produce a nearly-uniform prediction distribution).
    if _is_blank(arr):
        logger.warning("Processed image appears blank — canvas may be empty.")

    # 8. Build thumbnail PNG for frontend display
    thumbnail_b64 = array_to_b64_png(arr)

    return ProcessedImage(
        flat_array=arr.flatten(),           # (784,)
        grid_array=arr,                     # (28, 28)
        thumbnail_b64=thumbnail_b64,
        original_size=original_size,
    )


def array_to_b64_png(arr: np.ndarray) -> str:
    """
    Convert a 28×28 float32 array (values [0.0, 1.0]) back to a base64 PNG.

    Used to send the processed thumbnail to the frontend so the user can
    see exactly what the neural network receives.

    Parameters
    ----------
    arr : float32 ndarray, shape (28, 28) or (784,)
        Pixel values in [0.0, 1.0].

    Returns
    -------
    str — base64-encoded PNG (no data-URI prefix).
    """
    if arr.ndim == 1:
        if arr.shape[0] != 784:
            raise ValueError(f"Expected 784 elements for flat array, got {arr.shape[0]}")
        arr = arr.reshape(28, 28)

    if arr.shape != (28, 28):
        raise ValueError(f"Expected shape (28, 28), got {arr.shape}")

    # Scale back to uint8 [0, 255]
    uint8_arr = (arr * 255.0).clip(0, 255).astype(np.uint8)
    pil_img = Image.fromarray(uint8_arr)  # mode inferred from dtype (uint8 → L)

    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


def mnist_array_to_b64_png(flat_array: np.ndarray) -> str:
    """
    Convert a flat MNIST sample (shape 784, values [0.0, 1.0]) to a display PNG.

    MNIST images are already in the bright-digit-on-dark-bg convention.
    We invert them for display so they look like white paper with dark ink,
    which is more natural for users.

    Parameters
    ----------
    flat_array : float32 ndarray, shape (784,)

    Returns
    -------
    str — base64-encoded PNG.
    """
    arr = flat_array.reshape(28, 28)
    # Invert for display (MNIST bright → display dark, i.e. ink on paper look)
    display_arr = 1.0 - arr
    return array_to_b64_png(display_arr)
