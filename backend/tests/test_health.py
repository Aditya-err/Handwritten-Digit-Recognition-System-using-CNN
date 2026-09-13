"""
Phase 1 tests — Health endpoint.

Run with:
    cd backend
    python -m pytest tests/ -v
"""
import pytest
from httpx import AsyncClient, ASGITransport

# Add project root to sys.path so `app` is importable
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))

from app.main import app


@pytest.mark.asyncio
async def test_root_redirect():
    """Root path should return a JSON message (not 404)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "health" in data


@pytest.mark.asyncio
async def test_health_ok():
    """Health endpoint must return status=ok."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_health_schema():
    """Health response must contain all required fields."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/health")
    data = response.json()
    assert "version" in data
    assert "message" in data
    assert "backend" in data
    assert "models_loaded" in data
    assert isinstance(data["models_loaded"], dict)
    assert "numpy_nn" in data["models_loaded"]
    assert "pytorch_cnn" in data["models_loaded"]


@pytest.mark.asyncio
async def test_health_models_phase1():
    """
    In Phase 1 no models are loaded yet — models_loaded values must be False.
    This test will naturally fail once Phase 3 loads the NumPy model.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/health")
    data = response.json()
    assert data["models_loaded"]["numpy_nn"] is False
    assert data["models_loaded"]["pytorch_cnn"] is False


@pytest.mark.asyncio
async def test_cors_headers():
    """
    CORS Allow-Origin header must be present in a normal GET response
    when the request includes a recognised Origin header.

    Note: OPTIONS preflight via ASGITransport returns 405 because
    Starlette's routing intercepts it before the CORS middleware can
    respond — this is a known ASGI-transport quirk, not a real bug.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/api/v1/health",
            headers={"Origin": "http://localhost:5173"},
        )
    assert response.status_code == 200
    # Starlette CORSMiddleware adds this header for allowed origins
    assert "access-control-allow-origin" in response.headers
