import { useEffect, useState } from 'react';
import type { NeuronDetail } from '../types/nn';

interface LayerWeights {
  layer_name: string;
  weights: number[][]; // [input_size][output_size] or transposed?
  biases: number[];
}

interface NetworkVisualizerProps {
  intermediateStates: Record<string, number[]> | null;
  weights: LayerWeights[] | null;
  inputImageB64: string | null;
  onSelectNeuron: (neuron: NeuronDetail | null) => void;
  prediction: number | null;
}

// Fixed dimensions for SVG
const SVG_WIDTH = 800;
const SVG_HEIGHT = 500;

const LAYER_X = {
  INPUT: 100,
  DENSE1: 300,
  DENSE2: 500,
  OUTPUT: 700
};

// We sample 16 nodes for hidden layers
const SAMPLED_HIDDEN_COUNT = 16;
// All 10 for output
const OUTPUT_COUNT = 10;

export function NetworkVisualizer({
  intermediateStates,
  weights,
  inputImageB64,
  onSelectNeuron,
  prediction
}: NetworkVisualizerProps) {
  
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Animation state machine
  // 0: Idle/Input, 1: Dense 1 (z), 2: ReLU 1 (a), 3: Dense 2 (z), 4: ReLU 2 (a), 5: Dense 3 (z), 6: Softmax (a)
  const MAX_STEP = 6;

  useEffect(() => {
    let timer: number;
    if (isPlaying) {
      timer = window.setInterval(() => {
        setActiveStep(prev => {
          if (prev >= MAX_STEP) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 800);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const reset = () => {
    setIsPlaying(false);
    setActiveStep(0);
    onSelectNeuron(null);
  };

  // Pre-calculate node positions
  const getHiddenY = (index: number, count: number) => {
    const spacing = 400 / count;
    return 50 + (index * spacing) + (spacing / 2);
  };

  const getOutputY = (index: number) => {
    const spacing = 400 / OUTPUT_COUNT;
    return 50 + (index * spacing) + (spacing / 2);
  };

  const handleNodeClick = (layerIndex: number, layerName: string, neuronIndex: number, activationFn: any, isOutput = false) => {
    if (!weights || !intermediateStates) return;

    // Find the dense layer weights
    const denseKey = `Dense_${layerIndex}`;
    const actKey = isOutput ? `Softmax_${layerIndex + 1}` : `ReLU_${layerIndex + 1}`;
    
    // Some logic to extract weights if available
    let bias = 0;
    let z = 0;
    let a = 0;
    
    if (intermediateStates[denseKey]) {
      z = intermediateStates[denseKey][neuronIndex];
    }
    if (intermediateStates[actKey]) {
      a = intermediateStates[actKey][neuronIndex];
    }

    const denseWeights = weights.find(w => w.layer_name === denseKey);
    if (denseWeights) {
      bias = denseWeights.biases[neuronIndex];
    }

    onSelectNeuron({
      neuron_id: neuronIndex,
      layer_name: layerName,
      layer_index: layerIndex,
      activation_value: a,
      pre_activation_value: z,
      bias: bias,
      activation_function: activationFn,
      incoming_weights: [], // omitted for brevity in inspector
      outgoing_weights: []
    });
  };

  // Helper to get activation value for color
  const getActivation = (layerKey: string, index: number, stepRequired: number) => {
    if (activeStep < stepRequired || !intermediateStates || !intermediateStates[layerKey]) {
      return 0; // Not active yet
    }
    return intermediateStates[layerKey][index];
  };

  // Render nodes
  const renderHiddenLayer = (x: number, count: number, name: string, layerIdx: number, actStep: number, actKey: string, isSoftmax=false) => {
    const nodes = [];
    for (let i = 0; i < count; i++) {
      const y = getHiddenY(i, count);
      
      let a = getActivation(actKey, i, actStep);
      // Normalize alpha a bit for visualization
      let alpha = isSoftmax ? a : Math.min(1.0, Math.max(0.1, a / 2.0));
      if (!intermediateStates || activeStep < actStep) alpha = 0.1;
      
      const isPredicted = isSoftmax && prediction === i && activeStep >= 6;

      nodes.push(
        <g key={`${name}-${i}`} 
           transform={`translate(${x}, ${y})`} 
           onClick={() => handleNodeClick(layerIdx, name, i, isSoftmax ? 'softmax' : 'relu', isSoftmax)}
           className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <circle 
            r={12} 
            fill={isPredicted ? '#10b981' : `rgba(59, 130, 246, ${alpha})`}
            stroke={isPredicted ? '#059669' : '#3b82f6'} 
            strokeWidth={2}
          />
          {isSoftmax && (
            <text x={20} y={5} className="text-sm font-bold fill-current" style={{ fill: 'var(--text-primary)' }}>
              {i}
            </text>
          )}
        </g>
      );
    }
    return nodes;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-center justify-center gap-4 bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-color)]">
        <button onClick={() => setIsPlaying(!isPlaying)} className="btn-primary py-1 px-4 text-sm" disabled={!intermediateStates}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button 
          onClick={() => setActiveStep(p => Math.min(MAX_STEP, p + 1))} 
          className="btn-secondary py-1 px-4 text-sm"
          disabled={!intermediateStates || activeStep >= MAX_STEP}
        >
          Step
        </button>
        <button onClick={reset} className="btn-secondary py-1 px-4 text-sm">
          Reset
        </button>
        <span className="text-sm font-mono opacity-70 ml-4">
          Step: {activeStep} / {MAX_STEP}
        </span>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] flex justify-center py-8">
        <svg width={SVG_WIDTH} height={SVG_HEIGHT} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="max-w-full h-auto">
          
          <g>
            {/* Input to Dense 1 (Generic faint lines since input is an image) */}
            <g opacity={0.15}>
              {Array.from({length: SAMPLED_HIDDEN_COUNT}).map((_, i) => (
                <line key={`l1-${i}`} x1={LAYER_X.INPUT + 50} y1={250} x2={LAYER_X.DENSE1} y2={getHiddenY(i, SAMPLED_HIDDEN_COUNT)} stroke="#888" strokeWidth="0.5" />
              ))}
            </g>
            
            {/* Dense 1 to Dense 2 */}
            {Array.from({length: SAMPLED_HIDDEN_COUNT}).map((_, i) => (
              Array.from({length: SAMPLED_HIDDEN_COUNT}).map((_, j) => {
                // i is Dense_1 index, j is Dense_2 index
                const dense2Weights = weights?.find(w => w.layer_name === 'Dense_2');
                let weight = 0;
                if (dense2Weights) {
                  // Wait, weights matrix is [input_size][output_size]
                  // i is input (Dense_1), j is output (Dense_2)
                  weight = dense2Weights.weights[i][j];
                }
                const strokeColor = weight > 0 ? '#3b82f6' : '#ef4444'; // Blue : Red
                const opacity = Math.min(0.8, Math.abs(weight) * 2); // Weak weights are transparent
                
                return (
                  <line key={`l2-${i}-${j}`} x1={LAYER_X.DENSE1} y1={getHiddenY(i, SAMPLED_HIDDEN_COUNT)} x2={LAYER_X.DENSE2} y2={getHiddenY(j, SAMPLED_HIDDEN_COUNT)} stroke={strokeColor} opacity={opacity} strokeWidth="1" />
                );
              })
            ))}
            
            {/* Dense 2 to Output */}
            {Array.from({length: SAMPLED_HIDDEN_COUNT}).map((_, i) => (
              Array.from({length: OUTPUT_COUNT}).map((_, j) => {
                const dense4Weights = weights?.find(w => w.layer_name === 'Dense_4');
                let weight = 0;
                if (dense4Weights) {
                  weight = dense4Weights.weights[i][j];
                }
                const strokeColor = weight > 0 ? '#3b82f6' : '#ef4444';
                const opacity = Math.min(0.8, Math.abs(weight) * 2);
                
                return (
                  <line key={`l3-${i}-${j}`} x1={LAYER_X.DENSE2} y1={getHiddenY(i, SAMPLED_HIDDEN_COUNT)} x2={LAYER_X.OUTPUT} y2={getOutputY(j)} stroke={strokeColor} opacity={opacity} strokeWidth="1.5" />
                );
              })
            ))}
          </g>

          {/* Input Layer */}
          <g transform={`translate(${LAYER_X.INPUT - 50}, 200)`}>
            {inputImageB64 ? (
              <image href={`data:image/png;base64,${inputImageB64}`} width="100" height="100" style={{ imageRendering: 'pixelated' }} />
            ) : (
              <rect width="100" height="100" fill="transparent" stroke="#555" strokeDasharray="4" />
            )}
            <text x="50" y="125" textAnchor="middle" className="text-sm fill-current opacity-70" style={{ fill: 'var(--text-primary)' }}>Input (28x28)</text>
          </g>

          {/* Dense 1 */}
          {renderHiddenLayer(LAYER_X.DENSE1, SAMPLED_HIDDEN_COUNT, 'Dense 1', 0, 2, 'ReLU_1')}
          <text x={LAYER_X.DENSE1} y={480} textAnchor="middle" className="text-xs fill-current opacity-70" style={{ fill: 'var(--text-primary)' }}>128 Neurons (16 shown)</text>

          {/* Dense 2 */}
          {renderHiddenLayer(LAYER_X.DENSE2, SAMPLED_HIDDEN_COUNT, 'Dense 2', 2, 4, 'ReLU_3')}
          <text x={LAYER_X.DENSE2} y={480} textAnchor="middle" className="text-xs fill-current opacity-70" style={{ fill: 'var(--text-primary)' }}>64 Neurons (16 shown)</text>

          {/* Output */}
          {renderHiddenLayer(LAYER_X.OUTPUT, OUTPUT_COUNT, 'Output', 4, 6, 'Softmax_5', true)}
          <text x={LAYER_X.OUTPUT} y={480} textAnchor="middle" className="text-xs fill-current opacity-70" style={{ fill: 'var(--text-primary)' }}>10 Classes</text>

        </svg>
      </div>
    </div>
  );
}
