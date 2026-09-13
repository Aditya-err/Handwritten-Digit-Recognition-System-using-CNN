import type { NeuronDetail } from '../types/nn';
import { Info, Calculator } from 'lucide-react';

interface NeuronInspectorProps {
  neuron: NeuronDetail | null;
}

export function NeuronInspector({ neuron }: NeuronInspectorProps) {
  if (!neuron) {
    return (
      <div className="card h-full flex flex-col items-center justify-center text-center p-6 text-sm opacity-60">
        <Info className="mb-3" size={24} />
        <p>Select a neuron in the network<br/>to inspect its state and math.</p>
      </div>
    );
  }

  // Determine activation formula
  let formula = '';
  if (neuron.activation_function === 'relu') {
    formula = 'a = max(0, z)';
  } else if (neuron.activation_function === 'softmax') {
    formula = 'a = e^z / Σ(e^z)';
  } else {
    formula = 'a = z';
  }

  return (
    <div className="card h-full flex flex-col p-5 overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--border-color)]">
        <Calculator size={18} className="text-brand-500" />
        <h3 className="font-semibold text-base">Neuron Inspector</h3>
      </div>
      
      <div className="space-y-4 text-sm">
        <div>
          <div className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1">Layer</div>
          <div className="font-medium text-base">{neuron.layer_name}</div>
        </div>
        
        <div>
          <div className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1">Neuron Index</div>
          <div className="font-mono bg-[var(--bg-secondary)] px-2 py-1 rounded inline-block">
            {neuron.neuron_id}
          </div>
        </div>

        <div>
          <div className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1">Math</div>
          <div className="font-mono text-xs bg-[var(--bg-secondary)] p-2 rounded mb-1">
            z = Σ(xᵢ·wᵢ) + b
          </div>
          <div className="font-mono text-xs bg-[var(--bg-secondary)] p-2 rounded">
            {formula}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded">
            <div className="text-amber-600/80 dark:text-amber-400/80 text-xs uppercase tracking-wider mb-1">Pre-act (z)</div>
            <div className="font-mono text-amber-700 dark:text-amber-300">
              {neuron.pre_activation_value.toFixed(4)}
            </div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded">
            <div className="text-emerald-600/80 dark:text-emerald-400/80 text-xs uppercase tracking-wider mb-1">Activation (a)</div>
            <div className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">
              {neuron.activation_value.toFixed(4)}
            </div>
          </div>
        </div>
        
        {neuron.bias !== undefined && (
          <div>
            <div className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-1">Bias (b)</div>
            <div className="font-mono bg-[var(--bg-secondary)] px-2 py-1 rounded inline-block">
              {neuron.bias.toFixed(6)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
