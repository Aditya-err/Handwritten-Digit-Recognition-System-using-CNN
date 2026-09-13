/**
 * useBackendStatus hook.
 *
 * Polls /health on mount and exposes status to consumers.
 * Returns loading, error, and the health data.
 */
import { useState, useEffect, useCallback } from 'react';
import { fetchHealth } from '../services/api';
import type { HealthResponse } from '../types/nn';

export interface BackendStatus {
  loading: boolean;
  online: boolean;
  health: HealthResponse | null;
  error: string | null;
  refetch: () => void;
}

export function useBackendStatus(): BackendStatus {
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHealth();
      setHealth(data);
      setOnline(data.status === 'ok');
    } catch (err: unknown) {
      setOnline(false);
      setHealth(null);
      if (err && typeof err === 'object' && 'error' in err) {
        setError((err as { error: string }).error);
      } else {
        setError('Cannot reach backend. Is the server running?');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { loading, online, health, error, refetch: check };
}
