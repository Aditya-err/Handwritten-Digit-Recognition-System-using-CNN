import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ApiError, HealthResponse } from '../types/nn';

// ---------------------------------------------------------------------------
// We need to mock import.meta.env before importing the module under test.
// Vitest supports this natively via the import.meta.env object which is
// already available in the jsdom environment.
// ---------------------------------------------------------------------------

// Dynamic import so env is settled before the module reads BASE_URL.
let fetchHealth: typeof import('./api').fetchHealth;

beforeEach(async () => {
  // Ensure a clean VITE_API_URL for each test so BASE_URL is predictable.
  import.meta.env.VITE_API_URL = 'http://localhost:8000';

  // Reset modules so the module-level BASE_URL is re-evaluated.
  vi.resetModules();

  const mod = await import('./api');
  fetchHealth = mod.fetchHealth;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// fetchHealth - happy path
// ---------------------------------------------------------------------------
describe('fetchHealth', () => {
  it('returns parsed JSON on a successful response', async () => {
    const mockResponse: HealthResponse = {
      status: 'ok',
      version: '1.0.0',
      message: 'Backend is running',
      backend: 'fastapi',
      models_loaded: { numpy_nn: true, pytorch_cnn: false },
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    const result = await fetchHealth();
    expect(result).toEqual(mockResponse);

    // Verify the correct URL was called
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/health',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// request wrapper - error handling
// ---------------------------------------------------------------------------
describe('request wrapper (via fetchHealth)', () => {
  it('throws an ApiError with server-provided detail on non-2xx response', async () => {
    const serverError: ApiError = {
      error: 'Internal Server Error',
      detail: 'Model not loaded',
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve(serverError),
      }),
    );

    await expect(fetchHealth()).rejects.toEqual(serverError);
  });

  it('throws a generic ApiError when the error response body is not valid JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: () => Promise.reject(new SyntaxError('Unexpected token')),
      }),
    );

    await expect(fetchHealth()).rejects.toEqual({ error: 'HTTP 502' });
  });

  it('propagates network errors (e.g. fetch itself rejects)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    );

    await expect(fetchHealth()).rejects.toThrow('Failed to fetch');
  });
});

// ---------------------------------------------------------------------------
// BASE_URL normalisation
// ---------------------------------------------------------------------------
describe('BASE_URL normalisation', () => {
  it('strips a trailing /api/v1 from VITE_API_URL to avoid duplication', async () => {
    import.meta.env.VITE_API_URL = 'http://localhost:8000/api/v1';
    vi.resetModules();

    const mod = await import('./api');

    const mockResponse: HealthResponse = {
      status: 'ok',
      version: '1.0.0',
      message: 'Running',
      backend: 'fastapi',
      models_loaded: { numpy_nn: true, pytorch_cnn: false },
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }),
    );

    await mod.fetchHealth();

    // Should NOT double up to /api/v1/api/v1/health
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/health',
      expect.anything(),
    );
  });

  it('strips a trailing /api/v1/ (with slash) from VITE_API_URL', async () => {
    import.meta.env.VITE_API_URL = 'http://localhost:8000/api/v1/';
    vi.resetModules();

    const mod = await import('./api');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'ok', version: '1', message: '', backend: '', models_loaded: { numpy_nn: false, pytorch_cnn: false } }),
      }),
    );

    await mod.fetchHealth();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/health',
      expect.anything(),
    );
  });
});
