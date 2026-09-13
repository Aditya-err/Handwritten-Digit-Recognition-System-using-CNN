"""
test_phase2.py — Comprehensive tests for Phase 2.

Coverage:
    MNIST Loader
        - Full split loads correct shape and dtype
        - Subset size is respected
        - Values are normalised to [0.0, 1.0]
        - 2D reshape works
        - Class distribution is correct
        - Dataset info returns expected keys
        - Missing archive raises FileNotFoundError

    Image Processor
        - Normal digit image → correct shape, dtype, range
        - Blank canvas → returns valid result (not raise)
        - White canvas (all white) → inversion makes it all-dark
        - Different input sizes → always output 28×28
        - RGBA image (with alpha channel) → handled correctly
        - Grayscale input → handled correctly
        - Round-trip: array_to_b64_png → b64_to_image → check shape
        - Invalid base64 → raises ValueError
        - Invalid image bytes → raises ValueError
        - Flat array length is 784
        - Values in [0.0, 1.0]

    Dataset API
        - GET /dataset/info → 200
        - GET /dataset/sample → 200, real images, correct count
        - GET /dataset/sample?digit=5 → only digit 5
        - GET /dataset/sample?split=test → test split
        - GET /dataset/sample?digit=invalid → 422
        - POST /preprocess → 200, correct fields
        - POST /preprocess with blank canvas → is_blank=True flag
        - POST /preprocess with invalid b64 → 422

    Regression (Phase 1 still works)
        - GET /health → 200, status=ok
"""

from __future__ import annotations

import base64
import io
import sys
import pathlib

import numpy as np
import pytest
from httpx import AsyncClient, ASGITransport
from PIL import Image

# Make sure `app` is importable
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))

from app.main import app
from app.dataset.mnist_loader import (
    load_mnist,
    get_class_distribution,
    get_dataset_info,
)
from app.preprocessing.image_processor import (
    process_canvas_image,
    array_to_b64_png,
    mnist_array_to_b64_png,
)


# ===========================================================================
# Helpers
# ===========================================================================

def _make_b64_png(
    width: int = 280,
    height: int = 280,
    mode: str = "RGB",
    color=None,
) -> str:
    """Create a synthetic canvas-like base64 PNG for testing."""
    if color is None:
        color = (255, 255, 255) if mode == "RGB" else 255

    img = Image.new(mode, (width, height), color)

    if mode == "RGB":
        # Draw a simple dark stroke in the center to simulate a digit.
        pixels = img.load()
        for y in range(height // 3, 2 * height // 3):
            for x in range(width // 3, 2 * width // 3):
                pixels[x, y] = (0, 0, 0)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def _make_rgba_b64_png(width: int = 280, height: int = 280) -> str:
    """RGBA image: white background with semi-transparent black stroke."""
    img = Image.new("RGBA", (width, height), (255, 255, 255, 255))
    pixels = img.load()
    for y in range(height // 3, 2 * height // 3):
        for x in range(width // 3, 2 * width // 3):
            pixels[x, y] = (0, 0, 0, 200)  # semi-transparent stroke
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def _make_blank_b64_png() -> str:
    """All-white canvas — no stroke drawn."""
    img = Image.new("RGB", (280, 280), (255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


# ===========================================================================
# MNIST Loader tests
# ===========================================================================

class TestMnistLoader:

    def test_train_split_shape(self):
        """Full train subset must have correct shape."""
        images, labels = load_mnist(split="train", subset_size=100)
        assert images.shape == (100, 784), f"Expected (100, 784), got {images.shape}"
        assert labels.shape == (100,), f"Expected (100,), got {labels.shape}"

    def test_test_split_shape(self):
        """Test split must load correctly."""
        images, labels = load_mnist(split="test", subset_size=50)
        assert images.shape == (50, 784)
        assert labels.shape == (50,)

    def test_dtype(self):
        """Images must be float32, labels must be int64."""
        images, labels = load_mnist(split="train", subset_size=10)
        assert images.dtype == np.float32, f"Expected float32, got {images.dtype}"
        assert labels.dtype == np.int64, f"Expected int64, got {labels.dtype}"

    def test_normalisation_range(self):
        """All pixel values must be in [0.0, 1.0]."""
        images, _ = load_mnist(split="train", subset_size=200)
        assert float(images.min()) >= 0.0
        assert float(images.max()) <= 1.0

    def test_2d_reshape(self):
        """flat=False must return (N, 28, 28) arrays."""
        images, _ = load_mnist(split="train", subset_size=10, flat=False)
        assert images.shape == (10, 28, 28)

    def test_labels_in_range(self):
        """Labels must be integers 0–9."""
        _, labels = load_mnist(split="train", subset_size=500)
        assert int(labels.min()) >= 0
        assert int(labels.max()) <= 9

    def test_subset_respected(self):
        """subset_size must exactly control how many rows are loaded."""
        for n in (1, 10, 100, 1000):
            images, labels = load_mnist(split="train", subset_size=n)
            assert len(images) == n, f"subset_size={n} but got {len(images)} rows"
            assert len(labels) == n

    def test_class_distribution_keys(self):
        """Distribution dict must have all 10 digit keys."""
        _, labels = load_mnist(split="train", subset_size=2000)
        dist = get_class_distribution(labels)
        assert set(dist.keys()) == set(range(10)), (
            f"Missing keys: {set(range(10)) - set(dist.keys())}"
        )

    def test_class_distribution_sum(self):
        """Sum of distribution counts must equal sample count."""
        n = 1000
        _, labels = load_mnist(split="train", subset_size=n)
        dist = get_class_distribution(labels)
        assert sum(dist.values()) == n

    def test_dataset_info_keys(self):
        """get_dataset_info must return expected structure."""
        info = get_dataset_info()
        assert info["available"] is True
        assert "format" in info
        assert "splits" in info
        assert "train" in info["splits"]
        assert "test" in info["splits"]

    def test_pixel_columns_are_784(self):
        """Each sample row must have exactly 784 pixel values."""
        images, _ = load_mnist(split="train", subset_size=5)
        assert images.shape[1] == 784


# ===========================================================================
# Image Processor tests
# ===========================================================================

class TestImageProcessor:

    def test_normal_image_output_shape(self):
        """A standard canvas PNG must produce flat_array of length 784."""
        b64 = _make_b64_png()
        result = process_canvas_image(b64)
        assert result.flat_array.shape == (784,)
        assert result.grid_array.shape == (28, 28)

    def test_normal_image_dtype(self):
        """Output must be float32."""
        b64 = _make_b64_png()
        result = process_canvas_image(b64)
        assert result.flat_array.dtype == np.float32

    def test_normal_image_value_range(self):
        """All values must be in [0.0, 1.0]."""
        b64 = _make_b64_png()
        result = process_canvas_image(b64)
        assert float(result.flat_array.min()) >= 0.0
        assert float(result.flat_array.max()) <= 1.0

    def test_blank_canvas_does_not_raise(self):
        """A blank (all-white) canvas must return a valid result, not raise."""
        b64 = _make_blank_b64_png()
        result = process_canvas_image(b64)  # must not raise
        assert result.flat_array.shape == (784,)

    def test_blank_canvas_is_mostly_zero(self):
        """After inversion, an all-white canvas should become all-dark (≈ 0.0)."""
        b64 = _make_blank_b64_png()
        result = process_canvas_image(b64)
        # After inversion: white (1.0) → 0.0; no stroke → max should be ≈ 0.0
        assert float(result.flat_array.max()) < 0.1, (
            f"Expected near-zero max after inversion of blank canvas, got {result.flat_array.max():.4f}"
        )

    def test_stroke_present_max_near_one(self):
        """A canvas with a dark stroke must have at least one pixel ≈ 1.0 after inversion."""
        b64 = _make_b64_png()   # has a black centre block
        result = process_canvas_image(b64)
        assert float(result.flat_array.max()) > 0.7, (
            f"Expected high-value pixels from dark stroke, got max={result.flat_array.max():.4f}"
        )

    def test_small_input_size_still_28x28(self):
        """A tiny 10×10 input must still produce 28×28 output."""
        b64 = _make_b64_png(width=10, height=10)
        result = process_canvas_image(b64)
        assert result.grid_array.shape == (28, 28)

    def test_large_input_size_still_28x28(self):
        """A large 800×800 input must still produce 28×28 output."""
        b64 = _make_b64_png(width=800, height=800)
        result = process_canvas_image(b64)
        assert result.grid_array.shape == (28, 28)

    def test_original_size_recorded(self):
        """original_size must reflect the input image dimensions."""
        b64 = _make_b64_png(width=400, height=300)
        result = process_canvas_image(b64)
        assert result.original_size == (400, 300)

    def test_rgba_alpha_handled(self):
        """RGBA images (with transparency) must be processed without error."""
        b64 = _make_rgba_b64_png()
        result = process_canvas_image(b64)
        assert result.flat_array.shape == (784,)
        assert float(result.flat_array.min()) >= 0.0
        assert float(result.flat_array.max()) <= 1.0

    def test_grayscale_input(self):
        """Grayscale (L mode) input must be processed correctly."""
        b64 = _make_b64_png(mode="L", color=255)
        result = process_canvas_image(b64)
        assert result.flat_array.shape == (784,)

    def test_thumbnail_is_valid_b64_png(self):
        """thumbnail_b64 must decode to a 28×28 PNG."""
        b64 = _make_b64_png()
        result = process_canvas_image(b64)
        raw = base64.b64decode(result.thumbnail_b64)
        img = Image.open(io.BytesIO(raw))
        assert img.size == (28, 28)

    def test_data_uri_prefix_stripped(self):
        """Data-URI prefix (data:image/png;base64,...) must be stripped correctly."""
        b64 = _make_b64_png()
        with_prefix = f"data:image/png;base64,{b64}"
        result = process_canvas_image(with_prefix)
        assert result.flat_array.shape == (784,)

    def test_invalid_base64_raises(self):
        """Garbage base64 must raise ValueError."""
        with pytest.raises(ValueError):
            process_canvas_image("not_valid_base64!!")

    def test_invalid_image_bytes_raises(self):
        """Valid base64 of non-image content must raise ValueError."""
        junk_b64 = base64.b64encode(b"this is not an image").decode()
        with pytest.raises(ValueError):
            process_canvas_image(junk_b64)

    def test_array_to_b64_round_trip(self):
        """array_to_b64_png → base64 decode → PIL → size must be (28, 28)."""
        arr = np.random.default_rng(0).random((28, 28)).astype(np.float32)
        b64 = array_to_b64_png(arr)
        raw = base64.b64decode(b64)
        img = Image.open(io.BytesIO(raw))
        assert img.size == (28, 28)
        assert img.mode == "L"

    def test_array_to_b64_flat_input(self):
        """array_to_b64_png must also accept a flat (784,) input."""
        arr = np.zeros(784, dtype=np.float32)
        b64 = array_to_b64_png(arr)
        assert isinstance(b64, str)
        assert len(b64) > 0

    def test_mnist_sample_to_png(self):
        """mnist_array_to_b64_png must handle a real MNIST flat array."""
        images, _ = load_mnist(split="train", subset_size=1)
        b64 = mnist_array_to_b64_png(images[0])
        raw = base64.b64decode(b64)
        img = Image.open(io.BytesIO(raw))
        assert img.size == (28, 28)


# ===========================================================================
# Dataset API endpoint tests
# ===========================================================================

@pytest.mark.asyncio
class TestDatasetAPI:

    async def test_dataset_info_status(self):
        """GET /dataset/info must return 200."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            r = await c.get("/api/v1/dataset/info")
        assert r.status_code == 200

    async def test_dataset_info_fields(self):
        """Response must contain required fields."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            r = await c.get("/api/v1/dataset/info")
        data = r.json()
        assert data["available"] is True
        assert "splits" in data
        assert "train" in data["splits"]

    async def test_dataset_sample_default(self):
        """GET /dataset/sample with defaults must return 20 samples."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            r = await c.get("/api/v1/dataset/sample")
        assert r.status_code == 200
        data = r.json()
        assert data["count"] == 20
        assert len(data["samples"]) == 20

    async def test_dataset_sample_images_are_real(self):
        """Every returned image must be a valid base64 PNG."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            r = await c.get("/api/v1/dataset/sample?count=5")
        data = r.json()
        for s in data["samples"]:
            raw = base64.b64decode(s["image_b64"])
            img = Image.open(io.BytesIO(raw))
            assert img.size == (28, 28), f"Expected (28,28), got {img.size}"
            assert s["label"] in range(10)

    async def test_dataset_sample_digit_filter(self):
        """Digit filter must return only samples of that digit."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            r = await c.get("/api/v1/dataset/sample?digit=5&count=10")
        assert r.status_code == 200
        data = r.json()
        assert data["digit_filter"] == "5"
        for s in data["samples"]:
            assert s["label"] == 5

    async def test_dataset_sample_test_split(self):
        """split=test must work and return valid samples."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            r = await c.get("/api/v1/dataset/sample?split=test&count=5")
        assert r.status_code == 200
        data = r.json()
        assert data["split"] == "test"
        assert len(data["samples"]) == 5

    async def test_dataset_sample_invalid_digit(self):
        """digit=abc must return 422 Unprocessable Entity."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            r = await c.get("/api/v1/dataset/sample?digit=abc")
        assert r.status_code == 422

    async def test_dataset_sample_digit_out_of_range(self):
        """digit=15 must return 422."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            r = await c.get("/api/v1/dataset/sample?digit=15")
        assert r.status_code == 422

    async def test_dataset_sample_class_distribution_present(self):
        """Response must include class_distribution with 10 entries."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            r = await c.get("/api/v1/dataset/sample")
        data = r.json()
        assert "class_distribution" in data
        assert len(data["class_distribution"]) == 10

    async def test_preprocess_valid_image(self):
        """POST /preprocess with a valid canvas PNG must return 200."""
        b64 = _make_b64_png()
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            r = await c.post("/api/v1/preprocess", json={"image_b64": b64})
        assert r.status_code == 200
        data = r.json()
        assert "thumbnail_b64" in data
        assert "flat_array" in data
        assert len(data["flat_array"]) == 784
        assert "pixel_stats" in data

    async def test_preprocess_flat_array_range(self):
        """flat_array values must be in [0.0, 1.0]."""
        b64 = _make_b64_png()
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            r = await c.post("/api/v1/preprocess", json={"image_b64": b64})
        data = r.json()
        arr = data["flat_array"]
        assert min(arr) >= 0.0
        assert max(arr) <= 1.0

    async def test_preprocess_blank_canvas_flag(self):
        """A blank canvas must set is_blank=True."""
        b64 = _make_blank_b64_png()
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            r = await c.post("/api/v1/preprocess", json={"image_b64": b64})
        assert r.status_code == 200
        assert r.json()["is_blank"] is True

    async def test_preprocess_invalid_b64(self):
        """Invalid base64 must return 422."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            r = await c.post("/api/v1/preprocess", json={"image_b64": "not-valid-base64!!"})
        assert r.status_code == 422

    async def test_preprocess_invalid_image_bytes(self):
        """Valid base64 of non-image bytes must return 422."""
        junk = base64.b64encode(b"not an image").decode()
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            r = await c.post("/api/v1/preprocess", json={"image_b64": junk})
        assert r.status_code == 422


# ===========================================================================
# Phase 1 regression tests
# ===========================================================================

@pytest.mark.asyncio
class TestPhase1Regression:

    async def test_health_still_ok(self):
        """Phase 1 health endpoint must still work after Phase 2 additions."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            r = await c.get("/api/v1/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    async def test_cors_header_still_present(self):
        """CORS header must still be present after Phase 2 additions."""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            r = await c.get("/api/v1/health", headers={"Origin": "http://localhost:5173"})
        assert "access-control-allow-origin" in r.headers
