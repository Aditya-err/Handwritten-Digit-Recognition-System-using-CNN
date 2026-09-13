/** @type {import('tailwindcss').Config} */
export default {
  // Enable class-based dark mode (toggled via `dark` class on <html>)
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Brand palette — works in both light and dark
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',  // primary
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Activation color scale
        neuron: {
          inactive: '#374151',     // gray-700
          active:   '#6366f1',     // brand-500
          hot:      '#f59e0b',     // amber-400
          cold:     '#3b82f6',     // blue-500
        },
        // Surface colours for both themes
        surface: {
          dark:    '#0f0f1a',
          darkalt: '#1a1a2e',
          card:    '#16213e',
          border:  '#2d3748',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
      boxShadow: {
        'glow':    '0 0 20px rgba(99, 102, 241, 0.35)',
        'glow-sm': '0 0 10px rgba(99, 102, 241, 0.25)',
      },
    },
  },
  plugins: [],
};
