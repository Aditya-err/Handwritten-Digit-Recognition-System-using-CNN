/**
 * ErrorBoundary.tsx - Global error boundary component.
 *
 * Catches unhandled rendering errors in the React component tree
 * and displays a user-friendly fallback UI instead of a blank page.
 */
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-primary, #0f0f1a)',
            color: 'var(--text-primary, #f1f5f9)',
            fontFamily: "'Inter', system-ui, sans-serif",
            padding: '2rem',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              textAlign: 'center',
              padding: '2.5rem',
              borderRadius: '1rem',
              backgroundColor: 'var(--bg-card, #16213e)',
              border: '1px solid var(--border-color, #1e2d4a)',
            }}
          >
            <div
              style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                lineHeight: 1,
              }}
              aria-hidden="true"
            >
              ??
            </div>

            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: '0.75rem',
                color: 'var(--text-primary, #f1f5f9)',
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--text-secondary, #94a3b8)',
                marginBottom: '1.5rem',
                lineHeight: 1.6,
              }}
            >
              An unexpected error occurred while rendering the application.
              Please reload the page to try again.
            </p>

            {this.state.error && (
              <details
                style={{
                  textAlign: 'left',
                  marginBottom: '1.5rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted, #64748b)',
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    marginBottom: '0.5rem',
                    userSelect: 'none',
                  }}
                >
                  Error details
                </summary>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    background: 'var(--bg-secondary, #1a1a2e)',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    maxHeight: '200px',
                    overflow: 'auto',
                  }}
                >
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReload}
              style={{
                padding: '0.625rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: 'var(--accent, #6366f1)',
                color: '#ffffff',
                fontSize: '0.95rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor =
                  'var(--accent-hover, #4f46e5)';
              }}
              onMouseOut={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor =
                  'var(--accent, #6366f1)';
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
