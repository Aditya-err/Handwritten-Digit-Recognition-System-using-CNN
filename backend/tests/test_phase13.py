import pytest
import numpy as np
import torch
from fastapi.testclient import TestClient
from app.main import app
from app.api.model import global_nn
from app.api.cnn import get_model as get_cnn_model
from pathlib import Path

client = TestClient(app)

def test_predict_finite_input():
    flat_array = ["NaN"] * 784
    response = client.post("/api/v1/model/predict", json={"flat_array": flat_array})
    assert response.status_code == 422
    assert "finite" in response.json()["detail"].lower()

    flat_array = ["Infinity"] * 784
    response = client.post("/api/v1/model/predict", json={"flat_array": flat_array})
    assert response.status_code == 422
    assert "finite" in response.json()["detail"].lower()

def test_backprop_finite_input():
    flat_array = ["NaN"] * 784
    response = client.post("/api/v1/model/backprop", json={
        "flat_array": flat_array,
        "target_class": 0
    })
    assert response.status_code == 422
    assert "finite" in response.json()["detail"].lower()

def test_backprop_target_class_bounds():
    flat_array = [0.0] * 784
    response = client.post("/api/v1/model/backprop", json={
        "flat_array": flat_array,
        "target_class": 10
    })
    assert response.status_code == 422
    
    response = client.post("/api/v1/model/backprop", json={
        "flat_array": flat_array,
        "target_class": -1
    })
    assert response.status_code == 422

def test_cnn_predict_finite_input():
    flat_array = ["NaN"] * 784
    response = client.post("/api/v1/cnn/predict", json={"flat_array": flat_array})
    assert response.status_code == 422
    assert "finite" in response.json()["detail"].lower()

def test_model_predict_does_not_modify_global_nn():
    orig_weights = []
    for layer in global_nn.layers:
        if hasattr(layer, 'weights'):
            orig_weights.append(layer.weights.copy())
            
    flat_array = [0.1] * 784
    client.post("/api/v1/model/predict", json={"flat_array": flat_array})
    
    idx = 0
    for layer in global_nn.layers:
        if hasattr(layer, 'weights'):
            assert np.array_equal(layer.weights, orig_weights[idx])
            idx += 1

def test_cnn_predict_does_not_modify_weights():
    cnn = get_cnn_model()
    orig_state = {k: v.clone() for k, v in cnn.state_dict().items()}
    
    flat_array = [0.1] * 784
    client.post("/api/v1/cnn/predict", json={"flat_array": flat_array})
    
    new_state = cnn.state_dict()
    for k in orig_state.keys():
        assert torch.equal(orig_state[k], new_state[k])

def test_dataset_random_bounds():
    response = client.get("/api/v1/dataset/explorer/random?digit=10")
    assert response.status_code == 422
    
    response = client.get("/api/v1/dataset/explorer/random?digit=-1")
    assert response.status_code == 422

def test_dataset_explorer_bounds():
    response = client.get("/api/v1/dataset/explorer?index=999999")
    assert response.status_code == 404
