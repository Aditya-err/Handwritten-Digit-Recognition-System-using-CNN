import pytest
from fastapi.testclient import TestClient
from app.main import app
import numpy as np
from app.api.model import global_nn

client = TestClient(app)

def test_backprop_endpoint_success():
    flat_array = [0.0] * 784
    flat_array[0] = 1.0  # Just some non-zero input
    
    response = client.post("/api/v1/model/backprop", json={
        "flat_array": flat_array,
        "target_class": 3
    })
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify core fields
    assert "prediction" in data
    assert "probabilities" in data
    assert "loss" in data
    assert "output_gradient" in data
    assert "gradients" in data
    assert "intermediate_states" in data
    
    assert len(data["probabilities"]) == 10
    assert len(data["output_gradient"]) == 10
    
    # Probabilities should approximately sum to 1
    assert abs(sum(data["probabilities"]) - 1.0) < 1e-5
    
    # Loss should be finite
    assert np.isfinite(data["loss"])
    
    # Output gradient shape and finiteness
    assert all(np.isfinite(g) for g in data["output_gradient"])
    
def test_backprop_gradient_shapes():
    flat_array = [0.5] * 784
    
    response = client.post("/api/v1/model/backprop", json={
        "flat_array": flat_array,
        "target_class": 5
    })
    
    assert response.status_code == 200
    data = response.json()
    gradients = data["gradients"]
    
    # Ensure all 3 Dense layers have gradients (Dense_0, Dense_2, Dense_4)
    assert "Dense_0" in gradients
    assert "Dense_2" in gradients
    assert "Dense_4" in gradients
    
    # Dense_0: 784 -> 128 (but weights transposed is 784x128)
    assert len(gradients["Dense_0"]["weights"]) == 784
    assert len(gradients["Dense_0"]["weights"][0]) == 128
    assert len(gradients["Dense_0"]["biases"]) == 128
    
    # Dense_2: 128 -> 64
    assert len(gradients["Dense_2"]["weights"]) == 128
    assert len(gradients["Dense_2"]["weights"][0]) == 64
    assert len(gradients["Dense_2"]["biases"]) == 64
    
    # Dense_4: 64 -> 10
    assert len(gradients["Dense_4"]["weights"]) == 64
    assert len(gradients["Dense_4"]["weights"][0]) == 10
    assert len(gradients["Dense_4"]["biases"]) == 10

def test_backprop_different_target_changes_loss():
    flat_array = [0.2] * 784
    
    res1 = client.post("/api/v1/model/backprop", json={
        "flat_array": flat_array,
        "target_class": 1
    })
    
    res2 = client.post("/api/v1/model/backprop", json={
        "flat_array": flat_array,
        "target_class": 9
    })
    
    data1 = res1.json()
    data2 = res2.json()
    
    # If the model assigns different probabilities to class 1 and 9, the loss and output_gradient should differ.
    if data1["probabilities"][1] != data2["probabilities"][9]:
        assert data1["loss"] != data2["loss"]
        assert data1["output_gradient"] != data2["output_gradient"]

def test_backprop_does_not_modify_global_nn():
    # Cache initial state
    orig_weights = []
    for layer in global_nn.layers:
        if hasattr(layer, 'weights'):
            orig_weights.append(layer.weights.copy())
            
    # Run backprop
    flat_array = [0.5] * 784
    client.post("/api/v1/model/backprop", json={
        "flat_array": flat_array,
        "target_class": 5
    })
    
    # Check if modified
    idx = 0
    for layer in global_nn.layers:
        if hasattr(layer, 'weights'):
            assert np.array_equal(layer.weights, orig_weights[idx])
            idx += 1
