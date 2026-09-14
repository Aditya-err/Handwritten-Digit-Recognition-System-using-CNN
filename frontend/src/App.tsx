/**
 * App.tsx — Root application component.
 *
 * Responsibilities:
 *   - Theme management (dark/light)
 *   - Tab-based navigation using Sidebar
 *   - Backend health polling
 *   - Layout shell
 */
import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { DigitRecognitionPage } from './pages/DigitRecognitionPage';
import { ComparePage }   from './pages/ComparePage';
import { CnnPage }       from './pages/CnnPage';
import { NetworkPage }   from './pages/NetworkPage';
import { TrainingPage }  from './pages/TrainingPage';
import { DatasetPage }      from './pages/DatasetPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { LearnPage }        from './pages/LearnPage';
import { BackpropPage }     from './pages/BackpropPage';
import { useTheme }          from './hooks/useTheme';
import { useBackendStatus }  from './hooks/useBackendStatus';
import type { AppTab } from './types/nn';

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('digit-recognition');
  const [theme, toggleTheme] = useTheme();
  const backendStatus = useBackendStatus();

  // Render the active page
  const renderPage = () => {
    switch (activeTab) {
      case 'digit-recognition': return <DigitRecognitionPage onNavigate={setActiveTab} />;
      case 'compare':   return <ComparePage />;
      case 'cnn':       return <CnnPage />;
      case 'network':   return <NetworkPage onNavigate={setActiveTab} />;
      case 'training':  return <TrainingPage />;
      case 'backprop':  return <BackpropPage onNavigate={setActiveTab} />;
      case 'dataset':      return <DatasetPage />;
      case 'architecture': return <ArchitecturePage onNavigate={setActiveTab} />;
      case 'learn':        return <LearnPage onNavigate={setActiveTab} />;
      default:          return <DigitRecognitionPage onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-dvh flex flex-col md:flex-row w-full" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onThemeToggle={toggleTheme}
        backendStatus={backendStatus}
      />

      <div className="flex-1 flex flex-col min-w-0 h-dvh overflow-y-auto overflow-x-hidden">
        {/* Backend offline banner */}
        {!backendStatus.loading && !backendStatus.online && (
          <div className="w-full p-4 shrink-0">
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
        <main className="flex-1 w-full max-w-[1800px] mx-auto px-4 py-4 md:px-6 xl:px-8 h-full flex flex-col">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
