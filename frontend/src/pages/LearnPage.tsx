/**
 * LearnPage — Phase 1 stub.
 * Will contain: 16 educational concept cards covering all NN fundamentals.
 * Implemented in Phase 12.
 */
import { BookOpen, Cpu } from 'lucide-react';

const CONCEPT_TITLES = [
  'What is a Neuron?',
  'What is a Weight?',
  'What is a Bias?',
  'Activation Functions',
  'ReLU in Detail',
  'Softmax in Detail',
  'Forward Propagation',
  'Loss Functions',
  'Gradient Descent',
  'Backpropagation',
  'Epochs & Iterations',
  'Batch Size',
  'Learning Rate',
  'The MNIST Dataset',
  'Convolutional Neural Networks',
  'Dense vs Conv Layers',
];

export function LearnPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-600/20 mb-4">
          <BookOpen size={32} className="text-rose-400" />
        </div>
        <h1 className="page-title">Learn</h1>
        <p className="page-subtitle">
          {CONCEPT_TITLES.length} interactive concepts — from neurons to backpropagation
        </p>
      </div>

      {/* Phase 1: concept list preview */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-3">
          <Cpu size={14} />
          Phase 1 — Concept Index Only
        </div>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Interactive concept cards with definitions, formulas, and mini-visualizations
          will be implemented in <strong>Phase 12</strong>. Below is the full topic list.
        </p>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CONCEPT_TITLES.map((title, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
              style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}
            >
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                {i + 1}
              </span>
              {title}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
