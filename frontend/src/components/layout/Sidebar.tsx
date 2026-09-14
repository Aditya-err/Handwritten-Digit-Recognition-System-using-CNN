import { Brain, Sun, Moon, Activity, AlertCircle, Loader2, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { AppTab, Theme } from '../../types/nn';
import type { BackendStatus } from '../../hooks/useBackendStatus';

interface SidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  theme: Theme;
  onThemeToggle: () => void;
  backendStatus: BackendStatus;
}

const MAIN_TABS: { id: AppTab; label: string }[] = [
  { id: 'digit-recognition', label: 'Digit Recognition' },
  { id: 'network',           label: 'Network' },
  { id: 'compare',           label: 'Compare' },
  { id: 'cnn',               label: 'CNN' },
  { id: 'training',          label: 'Training' },
  { id: 'backprop',          label: 'Backpropagation' },
];

const LEARN_TABS: { id: AppTab; label: string }[] = [
  { id: 'learn',             label: 'Learn' },
  { id: 'architecture',      label: 'Architecture' },
];

function StatusIndicator({ status }: { status: BackendStatus }) {
  if (status.loading) {
    return (
      <span className="badge-loading gap-1.5 flex items-center justify-center w-full mt-2">
        <Loader2 size={12} className="animate-spin" />
        Connecting…
      </span>
    );
  }
  if (status.online) {
    return (
      <span className="badge-online gap-1.5 flex items-center justify-center w-full mt-2">
        <Activity size={12} />
        Backend online
      </span>
    );
  }
  return (
    <span className="badge-offline gap-1.5 flex items-center justify-center w-full mt-2" title={status.error ?? undefined}>
      <AlertCircle size={12} />
      Backend offline
    </span>
  );
}

export function Sidebar({ activeTab, onTabChange, theme, onThemeToggle, backendStatus }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleTabClick = (id: AppTab) => {
    onTabChange(id);
    setIsOpen(false);
  };

  const navContent = (
    <div className="flex h-full flex-col">
      {/* Header / Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-[var(--border-color)] shrink-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 shadow-glow-sm">
          <Brain size={24} className="text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-gradient leading-tight">Digit</span>
          <span className="text-sm font-semibold text-[var(--text-secondary)] leading-tight">Recognition</span>
        </div>
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6">
        <div className="mb-6">
          <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Main</h3>
          <nav className="flex flex-col gap-1">
            {MAIN_TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'flex items-center w-full rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                    'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1',
                    isActive
                      ? 'bg-brand-600/20 text-brand-400 dark:text-brand-300'
                      : 'hover:bg-brand-600/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Learn</h3>
          <nav className="flex flex-col gap-1">
            {LEARN_TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'flex items-center w-full rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                    'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1',
                    isActive
                      ? 'bg-brand-600/20 text-brand-400 dark:text-brand-300'
                      : 'hover:bg-brand-600/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer / Status / Theme */}
      <div className="p-4 border-t border-[var(--border-color)] shrink-0">
        <div className="flex items-center justify-between mb-2 px-2">
          <span className="text-sm font-medium text-[var(--text-secondary)]">Theme</span>
          <button
            onClick={onThemeToggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="btn-ghost rounded-lg p-2 flex items-center justify-center"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <StatusIndicator status={backendStatus} />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar + hamburger */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-[var(--bg-card)] shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 shadow-glow-sm">
            <Brain size={18} className="text-white" />
          </div>
          <span className="text-sm font-bold text-gradient">Digit Recognition</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-md"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar (Desktop fixed, Mobile sliding drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[260px] bg-[var(--bg-card)] border-r border-[var(--border-color)] transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </aside>
      
      {/* Desktop spacer to push content */}
      <div className="hidden md:block w-[260px] shrink-0" />
    </>
  );
}
