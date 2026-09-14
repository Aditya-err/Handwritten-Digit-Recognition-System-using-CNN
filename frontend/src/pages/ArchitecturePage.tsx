import { useState, useMemo } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  RotateCcw, 
  ArrowRight, 
  ShieldAlert, 
  Info,
  BookOpen
} from 'lucide-react';
import type { AppTab, ActivationFunction, ArchitectureLayer } from '../types/nn';

interface ArchitecturePageProps {
  onNavigate: (tab: AppTab) => void;
}

const PRODUCTION_LAYERS: ArchitectureLayer[] = [
  { id: 'l1', type: 'input', neurons: 784 },
  { id: 'l2', type: 'hidden', neurons: 128, activation: 'relu' },
  { id: 'l3', type: 'hidden', neurons: 64, activation: 'relu' },
  { id: 'l4', type: 'output', neurons: 10, activation: 'softmax' }
];

export function ArchitecturePage({ onNavigate }: ArchitecturePageProps) {
  const [layers, setLayers] = useState<ArchitectureLayer[]>(PRODUCTION_LAYERS);
  
  // Validation
  const hiddenLayers = layers.filter(l => l.type === 'hidden');
  const error = useMemo(() => {
    if (hiddenLayers.length > 5) return 'Maximum 5 hidden layers allowed.';
    if (hiddenLayers.some(l => l.neurons < 4 || l.neurons > 512 || isNaN(l.neurons))) {
      return 'Hidden layer neurons must be between 4 and 512.';
    }
    return null;
  }, [hiddenLayers]);

  // Is it identical to production?
  const isProduction = useMemo(() => {
    if (layers.length !== PRODUCTION_LAYERS.length) return false;
    return layers.every((l, i) => {
      const p = PRODUCTION_LAYERS[i];
      return l.type === p.type && l.neurons === p.neurons && l.activation === p.activation;
    });
  }, [layers]);

  // Parameter calculation
  const layerStats = useMemo(() => {
    let totalParams = 0;
    const stats = [];
    
    for (let i = 1; i < layers.length; i++) {
      const inputSize = layers[i-1].neurons;
      const outputSize = layers[i].neurons;
      const weights = inputSize * outputSize;
      const biases = outputSize;
      const params = weights + biases;
      totalParams += params;
      
      stats.push({
        layerIndex: i,
        name: layers[i].type === 'output' ? 'Output' : `Hidden ${i}`,
        inputSize,
        outputSize,
        activation: layers[i].activation,
        weights,
        biases,
        params
      });
    }
    return { stats, totalParams };
  }, [layers]);

  // Handlers
  const handleAddLayer = () => {
    if (hiddenLayers.length >= 5) return;
    const newLayer: ArchitectureLayer = {
      id: `h_${Date.now()}`,
      type: 'hidden',
      neurons: 64,
      activation: 'relu'
    };
    const newLayers = [...layers];
    newLayers.splice(newLayers.length - 1, 0, newLayer);
    setLayers(newLayers);
  };

  const handleRemoveLayer = (index: number) => {
    if (layers[index].type !== 'hidden') return;
    const newLayers = [...layers];
    newLayers.splice(index, 1);
    setLayers(newLayers);
  };

  const handleUpdateLayer = (index: number, updates: Partial<ArchitectureLayer>) => {
    const newLayers = [...layers];
    newLayers[index] = { ...newLayers[index], ...updates };
    setLayers(newLayers);
  };

  const handleReset = () => {
    setLayers(PRODUCTION_LAYERS);
  };

  // Render Visual Diagram
  const renderDiagram = () => {
    return (
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-center gap-2 md:gap-4 p-4 overflow-x-auto min-h-[300px]">
        {layers.map((layer, idx) => {
          const isInput = layer.type === 'input';
          const isOutput = layer.type === 'output';
          
          // Visual sampling for large layers
          const displayNodes = Math.min(layer.neurons, isInput ? 12 : isOutput ? 10 : 8);
          const nodes = Array.from({ length: displayNodes });
          
          return (
            <div key={layer.id} className="flex flex-col items-center shrink-0">
              {idx > 0 && (
                <div className="md:hidden flex flex-col items-center text-[var(--text-muted)] my-2">
                  <ArrowRight size={16} className="rotate-90" />
                </div>
              )}
              
              <div className="flex flex-row md:flex-col items-center gap-4">
                {idx > 0 && (
                  <div className="hidden md:flex text-[var(--text-muted)]">
                    <ArrowRight size={24} />
                  </div>
                )}
                
                <div className="flex flex-col items-center w-28 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border-color)]">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                    {isInput ? 'Input' : isOutput ? 'Output' : `Hidden ${idx}`}
                  </div>
                  <div className="text-xl font-bold font-mono text-[var(--text-primary)]">
                    {layer.neurons}
                  </div>
                  {layer.activation && (
                    <div className="text-[10px] uppercase font-semibold text-brand-500 bg-brand-500/10 px-1.5 py-0.5 rounded mt-1">
                      {layer.activation}
                    </div>
                  )}

                  <div className="flex flex-row md:flex-col gap-1 mt-4">
                    {nodes.map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-3 h-3 rounded-full ${isInput ? 'bg-zinc-400 dark:bg-zinc-600' : isOutput ? 'bg-amber-400' : 'bg-brand-400'}`} 
                      />
                    ))}
                    {layer.neurons > displayNodes && (
                      <div className="flex flex-row md:flex-col items-center justify-center gap-0.5 opacity-50 py-1">
                        <div className="w-1 h-1 rounded-full bg-current" />
                        <div className="w-1 h-1 rounded-full bg-current" />
                        <div className="w-1 h-1 rounded-full bg-current" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full pb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="text-brand-500" /> Architecture Editor
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Experiment with neural network structures in this educational sandbox.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isProduction ? (
            <span className="badge-online text-sm px-3 py-1">
              <ShieldAlert size={14} className="mr-1"/> Production Model
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-sm font-medium text-amber-500 border border-amber-500/30">
              Sandbox Mode
            </span>
          )}
        </div>
      </div>

      {!isProduction && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-3 rounded-lg flex items-start gap-2 text-sm">
          <Info size={18} className="shrink-0 mt-0.5" />
          <p>
            <strong>Sandbox Active:</strong> Any changes made here are for educational visualization only. 
            They do <strong>not</strong> modify or retrain the production model.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm font-medium">
          Error: {error}
        </div>
      )}

      {/* Visualizer */}
      <div className="card bg-zinc-50 dark:bg-zinc-900/50">
        {renderDiagram()}
        <div className="text-center text-xs text-[var(--text-muted)] mt-2">
          Connections and nodes are aggregated for visualization purposes.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Controls */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card space-y-3">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2 mb-4">
              <h2 className="font-bold">Layer Configuration</h2>
              {!isProduction && (
                <button 
                  onClick={handleReset}
                  className="text-xs text-brand-500 hover:underline flex items-center gap-1"
                >
                  <RotateCcw size={12}/> Reset
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {layers.map((layer, index) => {
                const isInput = layer.type === 'input';
                const isOutput = layer.type === 'output';

                return (
                  <div key={layer.id} className={`p-3 rounded border ${isInput ? 'border-zinc-300 dark:border-zinc-700 bg-black/5 dark:bg-white/5' : isOutput ? 'border-amber-500/30 bg-amber-500/5' : 'border-brand-500/30 bg-brand-500/5'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold capitalize">
                        {isInput ? 'Input' : isOutput ? 'Output' : `Hidden ${index}`}
                      </span>
                      {!isInput && !isOutput && (
                        <button 
                          onClick={() => handleRemoveLayer(index)}
                          className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-500/10"
                          title="Remove Layer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[var(--text-secondary)]">Neurons</span>
                        {isInput || isOutput ? (
                          <span className="font-mono bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded opacity-70">
                            {layer.neurons} <span className="text-[10px] uppercase ml-1">(Locked)</span>
                          </span>
                        ) : (
                          <input 
                            type="number" 
                            min="4" max="512"
                            value={isNaN(layer.neurons) ? '' : layer.neurons}
                            onChange={(e) => handleUpdateLayer(index, { neurons: parseInt(e.target.value) })}
                            className="bg-white dark:bg-zinc-800 border border-[var(--border-color)] rounded px-2 py-1 w-20 font-mono text-right"
                          />
                        )}
                      </div>

                      {layer.activation && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-[var(--text-secondary)]">Activation</span>
                          {isOutput ? (
                            <span className="font-mono text-xs bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded opacity-70">
                              {layer.activation}
                            </span>
                          ) : (
                            <select
                              value={layer.activation}
                              onChange={(e) => handleUpdateLayer(index, { activation: e.target.value as ActivationFunction })}
                              className="bg-white dark:bg-zinc-800 border border-[var(--border-color)] rounded px-2 py-1 text-xs font-mono"
                            >
                              <option value="relu">ReLU</option>
                              <option value="sigmoid">Sigmoid</option>
                              <option value="tanh">Tanh</option>
                              <option value="linear">Linear</option>
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={handleAddLayer}
              disabled={hiddenLayers.length >= 5}
              className="w-full mt-4 py-2 border border-dashed border-brand-500/50 text-brand-500 rounded flex items-center justify-center gap-2 text-sm hover:bg-brand-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={16} /> Add Hidden Layer
            </button>
          </div>
        </div>

        {/* Stats & Education */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold">Parameter Summary</h2>
              <div className="text-xl font-mono font-bold text-brand-500 bg-brand-500/10 px-3 py-1 rounded">
                {layerStats.totalParams.toLocaleString()}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] uppercase text-xs">
                  <tr>
                    <th className="px-3 py-2 rounded-tl">Layer</th>
                    <th className="px-3 py-2 text-right">In</th>
                    <th className="px-3 py-2 text-right">Out</th>
                    <th className="px-3 py-2">Activation</th>
                    <th className="px-3 py-2 text-right">Weights</th>
                    <th className="px-3 py-2 text-right">Biases</th>
                    <th className="px-3 py-2 text-right rounded-tr font-bold text-brand-500">Params</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs divide-y divide-[var(--border-color)]">
                  {layerStats.stats.map((stat, i) => (
                    <tr key={i} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="px-3 py-2 font-sans">{stat.name}</td>
                      <td className="px-3 py-2 text-right">{stat.inputSize}</td>
                      <td className="px-3 py-2 text-right">{stat.outputSize}</td>
                      <td className="px-3 py-2 text-[var(--text-secondary)]">{stat.activation}</td>
                      <td className="px-3 py-2 text-right text-[var(--text-secondary)]">{stat.weights.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-[var(--text-secondary)]">{stat.biases.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-bold">{stat.params.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <p className="text-xs text-[var(--text-muted)] mt-3">
              Dense layer parameters are calculated as: <code>(Inputs × Outputs) + Outputs</code>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-black/5 dark:bg-zinc-900 border-none space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-1.5 text-brand-500">
                <BookOpen size={16} /> Educational Feedback
              </h3>
              <ul className="text-xs space-y-2 text-[var(--text-secondary)]">
                <li><strong>MNIST Input:</strong> Fixed at 784 because the images are 28×28 pixels.</li>
                <li><strong>Classes Output:</strong> Fixed at 10 to represent the digits 0-9.</li>
                {hiddenLayers.length > 2 && (
                  <li><strong>Deep Networks:</strong> Adding more layers allows the model to learn highly abstract hierarchical features, but makes backpropagation harder due to vanishing gradients.</li>
                )}
                {hiddenLayers.length === 0 && (
                  <li><strong>Linear Classifier:</strong> Without hidden layers, this model is purely linear and cannot solve complex image topologies effectively.</li>
                )}
                {layerStats.totalParams > 150000 && (
                  <li className="text-amber-500"><strong>High Capacity:</strong> Large parameter counts can fit complex data, but risk overfitting if the dataset is too small.</li>
                )}
              </ul>
              <div className="pt-2">
                <button onClick={() => onNavigate('learn')} className="text-brand-500 hover:underline text-xs flex items-center gap-1">
                  Learn more about Architectures <ArrowRight size={12} />
                </button>
              </div>
            </div>

            <div className="card bg-black/5 dark:bg-zinc-900 border-none space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-1.5 text-[var(--text-primary)]">
                <Layers size={16} /> Activation Functions
              </h3>
              <ul className="text-xs space-y-2 text-[var(--text-secondary)]">
                <li><strong className="text-brand-400">ReLU:</strong> <code>max(0, x)</code> Standard hidden layer choice. Fights vanishing gradients.</li>
                <li><strong className="text-brand-400">Sigmoid:</strong> <code>1/(1+e^-x)</code> Squashes to [0,1]. Often causes vanishing gradients in deep layers.</li>
                <li><strong className="text-brand-400">Tanh:</strong> <code>tanh(x)</code> Squashes to [-1,1]. Zero-centered, generally better than Sigmoid.</li>
                <li><strong className="text-brand-400">Linear:</strong> <code>f(x)=x</code> Passes data unchanged. Ruins the network's non-linear power if overused.</li>
              </ul>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
