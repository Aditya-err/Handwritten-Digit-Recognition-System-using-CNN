/**
 * Navbar — top navigation bar with:
 *   - App title + logo
 *   - 5 tab links
 *   - Backend status indicator
 *   - Dark/light theme toggle
 */
import { Brain, Sun, Moon, Activity, AlertCircle, Loader2 } from 'lucide-react';
import type { AppTab, Theme } from '../../types/nn';
import type { BackendStatus } from '../../hooks/useBackendStatus';

interface NavbarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  theme: Theme;
  onThemeToggle: () => void;
  backendStatus: BackendStatus;
}

const TABS: { id: AppTab; label: string }[] = [
  { id: 'recognize', label: 'Recognize' },
  { id: 'compare',   label: 'Compare'   },
  { id: 'cnn',       label: 'CNN'       },
  { id: 'network',   label: 'Network'   },
  { id: 'training',  label: 'Training'  },
  { id: 'backprop',  label: 'Backprop'  },
  { id: 'dataset',      label: 'Dataset'      },
  { id: 'architecture', label: 'Architecture' },
  { id: 'learn',        label: 'Learn'        },
];

function StatusIndicator({ status }: { status: BackendStatus }) {
  if (status.loading) {
    return (
      <span className="badge-loading gap-1.5">
        <Loader2 size={10} className="animate-spin" />
        Connecting…
      </span>
    );
  }
  if (status.online) {
    return (
      <span className="badge-online gap-1.5">
        <Activity size={10} />
        Backend online
      </span>
    );
  }
  return (
    <span className="badge-offline gap-1.5" title={status.error ?? undefined}>
      <AlertCircle size={10} />
      Backend offline
    </span>
  );
}

export function Navbar({ activeTab, onTabChange, theme, onThemeToggle, backendStatus }: NavbarProps) {
  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
    >
      <div className="mx-auto flex max-w-screen-2xl items-center gap-6 px-4 py-3">

        {/* Logo + title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 shadow-glow-sm">
            <Brain size={18} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-bold text-gradient">NN Visualizer</span>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap custom-scrollbar pb-1 -mb-1" aria-label="Main navigation">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1',
                  isActive
                    ? 'bg-brand-600/20 text-brand-400 dark:text-brand-300'
                    : 'hover:bg-brand-600/10',
                ].join(' ')}
                style={{ color: isActive ? undefined : 'var(--text-secondary)' }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Backend status */}
          <StatusIndicator status={backendStatus} />

          {/* Theme toggle */}
          <button
            onClick={onThemeToggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="btn-ghost rounded-lg p-2"
          >
            {theme === 'dark'
              ? <Sun size={16} />
              : <Moon size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
}
