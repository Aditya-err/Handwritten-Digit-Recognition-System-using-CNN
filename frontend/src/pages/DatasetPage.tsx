/**
 * DatasetPage — Phase 1 stub.
 * Will contain: MNIST sample grid, class distribution, image inspector.
 * Implemented in Phase 11.
 */
import { Database, Cpu } from 'lucide-react';

export function DatasetPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20">
        <Database size={32} className="text-blue-400" />
      </div>
      <div>
        <h1 className="page-title">Dataset Explorer</h1>
        <p className="page-subtitle">Explore the MNIST handwritten digit dataset</p>
      </div>
      <div className="card max-w-md text-left">
        <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-2">
          <Cpu size={14} />
          Phase 1 — Scaffold Only
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Sample image grid, class distribution, and pixel inspector will be
          implemented in <strong>Phase 11</strong>.
        </p>
      </div>
    </div>
  );
}
