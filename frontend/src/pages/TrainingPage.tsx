/**
 * TrainingPage — Phase 1 stub.
 * Will contain: training controls, live loss/accuracy charts, WebSocket progress.
 * Implemented in Phase 8.
 */
import { BarChart2, Cpu } from 'lucide-react';

export function TrainingPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600/20">
        <BarChart2 size={32} className="text-emerald-400" />
      </div>
      <div>
        <h1 className="page-title">Training Dashboard</h1>
        <p className="page-subtitle">Train the NumPy neural network and watch it learn in real time</p>
      </div>
      <div className="card max-w-md text-left">
        <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-2">
          <Cpu size={14} />
          Phase 1 — Scaffold Only
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Training controls, loss/accuracy charts, and WebSocket live updates
          will be implemented in <strong>Phase 8</strong>.
        </p>
      </div>
    </div>
  );
}
