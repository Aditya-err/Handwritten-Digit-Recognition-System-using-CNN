import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.mark.asyncio
async def test_cnn_summary(async_client):
    response = await async_client.get("/api/v1/cnn/summary")
    assert response.status_code == 200
    data = response.json()
    assert "PyTorch CNN" in data["model_type"]
    assert data["output_classes"] == 10
    assert data["parameter_count"] > 0
    assert "Conv2D" in data["architecture"]

@pytest.mark.asyncio
async def test_cnn_predict_shape_error(async_client):
    # Pass 100 elements instead of 784
    bad_input = {"flat_array": [0.0] * 100}
    response = await async_client.post("/api/v1/cnn/predict", json=bad_input)
    assert response.status_code == 400
    assert "must be exactly 784" in response.json()["detail"]

@pytest.mark.asyncio
async def test_cnn_predict_success(async_client):
    # Pass valid 784 elements
    valid_input = {"flat_array": [0.0] * 784}
    response = await async_client.post("/api/v1/cnn/predict", json=valid_input)
    assert response.status_code == 200
    data = response.json()
    
    assert "prediction" in data
    assert 0 <= data["prediction"] <= 9
    
    assert "probabilities" in data
    assert len(data["probabilities"]) == 10
    assert 0.99 <= sum(data["probabilities"]) <= 1.01  # Approximately sums to 1
    
    assert "intermediate_states" in data
    states = data["intermediate_states"]
    assert "conv1_activation" in states
    assert "pool1_output" in states
    assert "conv2_activation" in states
    assert "pool2_output" in states
    assert "flattened" in states
    assert "logits" in states
    assert "probabilities" in states
