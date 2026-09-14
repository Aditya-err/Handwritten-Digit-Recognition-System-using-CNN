/**
 * Typed API client for the Neural Network Visualizer backend.
 *
 * Phase 1: health check only.
 * Later phases add predict(), train(), getWeights(), etc.
 *
 * All functions throw a typed ApiError on non-2xx responses.
 */
import type { HealthResponse, ApiError } from '../types/nn';

const RAW_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const BASE_URL = RAW_URL.replace(/\/api\/v1\/?$/, '') + '/api/v1';

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!response.ok) {
    let detail: ApiError = { error: `HTTP ${response.status}` };
    try {
      detail = await response.json();
    } catch {
      // ignore JSON parse failure
    }
    throw detail;
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
export async function fetchHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health');
}

// ---------------------------------------------------------------------------
// Phase 4+ — Prediction (stub signatures only, not yet wired)
// ---------------------------------------------------------------------------
// export async function predict(imageBase64: string, model: 'numpy_nn' | 'pytorch_cnn' = 'numpy_nn') { ... }

// ---------------------------------------------------------------------------
// Phase 8+ — Training (stub)
// ---------------------------------------------------------------------------
// export function openTrainingSocket(onMessage: (msg: EpochMetrics) => void): WebSocket { ... }
