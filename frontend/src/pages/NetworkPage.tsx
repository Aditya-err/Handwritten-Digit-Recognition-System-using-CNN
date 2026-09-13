/**
 * NetworkPage — Phase 1 stub.
 * Will contain: SVG network visualizer, neuron inspector, forward-pass animation.
 * Implemented in Phases 6–7.
 */
import { Network, Cpu } from 'lucide-react';

export function NetworkPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600/20">
        <Network size={32} className="text-purple-400" />
      </div>
      <div>
        <h1 className="page-title">Network Visualizer</h1>
        <p className="page-subtitle">Inspect neurons, weights, and activations interactively</p>
      </div>
      <div className="card max-w-md text-left">
        <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-2">
          <Cpu size={14} />
          Phase 1 — Scaffold Only
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          The interactive SVG network diagram, neuron inspector, and forward-pass
          animation will be implemented in <strong>Phases 6–7</strong>.
        </p>
      </div>
    </div>
  );
}
