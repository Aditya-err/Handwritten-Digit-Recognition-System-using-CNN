/**
 * RecognizePage — Phase 1 stub.
 * Will contain: drawing canvas, processed preview, prediction result, basic network viz.
 * Implemented in Phase 5.
 */
import { PenLine, Cpu } from 'lucide-react';

export function RecognizePage() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600/20">
        <PenLine size={32} className="text-brand-400" />
      </div>
      <div>
        <h1 className="page-title">Digit Recognition</h1>
        <p className="page-subtitle">Draw a digit and watch the neural network process it</p>
      </div>

      {/* Phase badge */}
      <div className="card max-w-md text-left">
        <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-2">
          <Cpu size={14} />
          Phase 1 — Scaffold Only
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          The drawing canvas, prediction pipeline, and neural-network visualization
          will be implemented in <strong>Phases 5–6</strong>. This page serves as the
          navigation shell and confirms the frontend routing is working correctly.
        </p>
      </div>
    </div>
  );
}
