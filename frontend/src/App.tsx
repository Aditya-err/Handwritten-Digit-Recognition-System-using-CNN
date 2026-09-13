/**
 * App.tsx — Root application component.
 *
 * Responsibilities:
 *   - Theme management (dark/light)
 *   - Tab-based navigation (no router needed for SPA tabs)
 *   - Backend health polling
 *   - Layout shell (Navbar + main content area)
 */
import { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { RecognizePage } from './pages/RecognizePage';
import { NetworkPage }   from './pages/NetworkPage';
import { TrainingPage }  from './pages/TrainingPage';
import { DatasetPage }   from './pages/DatasetPage';
import { LearnPage }     from './pages/LearnPage';
import { useTheme }          from './hooks/useTheme';
import { useBackendStatus }  from './hooks/useBackendStatus';
import type { AppTab } from './types/nn';

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('recognize');
  const [theme, toggleTheme] = useTheme();
  const backendStatus = useBackendStatus();

  // Render the active page
  const renderPage = () => {
    switch (activeTab) {
      case 'recognize': return <RecognizePage />;
      case 'network':   return <NetworkPage />;
      case 'training':  return <TrainingPage />;
      case 'dataset':   return <DatasetPage />;
      case 'learn':     return <LearnPage />;
    }
  };

  return (
    <div className="min-h-dvh flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onThemeToggle={toggleTheme}
        backendStatus={backendStatus}
      />

      {/* Backend offline banner */}
      {!backendStatus.loading && !backendStatus.online && (
        <div className="mx-auto w-full max-w-screen-2xl px-4 pt-3">
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <strong>Backend is offline.</strong>{' '}
            Start the FastAPI server with:{' '}
            <code className="mono rounded bg-red-500/20 px-1">
              cd backend &amp;&amp; uvicorn app.main:app --reload
            </code>
            {backendStatus.error && (
              <span className="ml-2 text-red-500/70">({backendStatus.error})</span>
            )}
            <button
              onClick={backendStatus.refetch}
              className="ml-3 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Page content */}
      <main className="flex-1 mx-auto w-full max-w-screen-2xl px-4 py-4">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer
        className="border-t py-3 text-center text-xs"
        style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
      >
        Neural Network Visualizer — Phase 1 &nbsp;·&nbsp; FastAPI + NumPy + PyTorch &nbsp;·&nbsp; React + Vite
      </footer>
    </div>
  );
}

export default App;
