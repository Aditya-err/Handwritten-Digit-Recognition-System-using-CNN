import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.api.dataset import _dataset_cache

client = TestClient(app)

@pytest.fixture(autouse=True)
def clear_cache():
    _dataset_cache.clear()
    yield
    _dataset_cache.clear()


def test_dataset_info():
    response = client.get("/api/v1/dataset/info")
    assert response.status_code == 200
    data = response.json()
    assert data["available"] is True
    assert data["num_classes"] == 10
    assert "train" in data["splits"]
    assert "test" in data["splits"]


def test_dataset_explorer_index():
    # Test valid index
    response = client.get("/api/v1/dataset/explorer?split=test&index=0")
    assert response.status_code == 200
    data = response.json()
    
    assert data["split"] == "test"
    assert data["total_samples"] == 10000
    
    sample = data["sample"]
    assert sample["index"] == 0
    assert sample["width"] == 28
    assert sample["height"] == 28
    assert len(sample["flat_array"]) == 784
    assert sample["label"] in range(10)
    
    dist = data["class_distribution"]
    assert len(dist) == 10
    assert "0" in dist  # JSON keys become strings


def test_dataset_explorer_index_out_of_bounds():
    response = client.get("/api/v1/dataset/explorer?split=test&index=100000")
    assert response.status_code == 404
    
    response = client.get("/api/v1/dataset/explorer?split=test&index=-1")
    assert response.status_code == 404


def test_dataset_explorer_random():
    response = client.get("/api/v1/dataset/explorer/random?split=test")
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["sample"]["index"] < 10000


def test_dataset_explorer_random_with_digit():
    # Test retrieving a random sample of a specific digit
    digit = 7
    response = client.get(f"/api/v1/dataset/explorer/random?split=test&digit={digit}")
    assert response.status_code == 200
    data = response.json()
    assert data["sample"]["label"] == digit
    
    # Test invalid digit
    response = client.get("/api/v1/dataset/explorer/random?split=test&digit=10")
    assert response.status_code == 422
