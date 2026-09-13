/**
 * useTheme hook — manages dark/light theme via `dark` class on <html>.
 *
 * Default: dark.
 * Persisted in localStorage so it survives page refreshes.
 */
import { useState, useEffect } from 'react';
import type { Theme } from '../types/nn';

const STORAGE_KEY = 'nn-viz-theme';
const DEFAULT_THEME: Theme = 'dark';

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return stored ?? DEFAULT_THEME;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return [theme, toggle];
}
