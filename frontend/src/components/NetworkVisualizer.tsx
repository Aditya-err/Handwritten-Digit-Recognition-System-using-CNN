import { useEffect, useState, useMemo, useRef } from 'react';
import type { NeuronDetail } from '../types/nn';

interface LayerWeights {
  layer_name: string;
  weights: number[][]; // [input_size][output_size]
  biases: number[];
}

interface NetworkVisualizerProps {
  intermediateStates: Record<string, number[]> | null;
  weights: LayerWeights[] | null;
  inputImageB64: string | null;
  onSelectNeuron: (neuron: NeuronDetail | null) => void;
  prediction: number | null;
  isInteractive?: boolean;
}

// We sample 20 nodes for hidden layers to make it look taller
const SAMPLED_HIDDEN_COUNT = 20;
// All 10 for output
const OUTPUT_COUNT = 10;

export function NetworkVisualizer({
  intermediateStates,
  weights,
  inputImageB64,
  onSelectNeuron,
  prediction,
  isInteractive = false
}: NetworkVisualizerProps) {
  
  // Fixed coordinates so neurons never jump when resized/inspected
  const dimensions = { width: 1000, height: 600 };

  const [activeStep, setActiveStep] = useState<number>(isInteractive ? 6 : 0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Animation state machine
  // 0: Idle/Input, 1: Dense 1 (z), 2: ReLU 1 (a), 3: Dense 2 (z), 4: ReLU 2 (a), 5: Dense 3 (z), 6: Softmax (a)
  const MAX_STEP = 6;

  // 1.5-second auto-play timer after prediction
  useEffect(() => {
    let timer: number;
    if (intermediateStates && prediction !== null) {
      setActiveStep(0);
      setIsPlaying(false);
      timer = window.setTimeout(() => {
        setIsPlaying(true);
      }, 1500);
    } else {
      setActiveStep(0);
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [intermediateStates, prediction]);

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

  // Dynamic Layout Calculations
  const paddingX = Math.max(80, dimensions.width * 0.12);
  const spacingX = (dimensions.width - paddingX * 2) / 3;
  
  const LAYER_X = {
    INPUT: paddingX,
    DENSE1: paddingX + spacingX,
    DENSE2: paddingX + spacingX * 2,
    OUTPUT: paddingX + spacingX * 3
  };

  const getHiddenY = (index: number, count: number) => {
    const verticalPadding = Math.max(100, dimensions.height * 0.2);
    const availableHeight = dimensions.height - verticalPadding * 2;
    const spacing = availableHeight / count;
    return verticalPadding + (index * spacing) + (spacing / 2);
  };

  const getOutputY = (index: number) => {
    const verticalPadding = Math.max(100, dimensions.height * 0.2);
    const availableHeight = dimensions.height - verticalPadding * 2;
    const spacing = availableHeight / OUTPUT_COUNT;
    return verticalPadding + (index * spacing) + (spacing / 2);
  };

  const handleNodeClick = (layerIndex: number, layerName: string, neuronIndex: number, activationFn: any, isOutput = false) => {
    if (!weights || !intermediateStates) return;

    const denseKey = `Dense_${layerIndex}`;
    const actKey = isOutput ? `Softmax_${layerIndex + 1}` : `ReLU_${layerIndex + 1}`;
    
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
      incoming_weights: [],
      outgoing_weights: []
    });
  };

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
      const y = isSoftmax ? getOutputY(i) : getHiddenY(i, count);
      
      let a = getActivation(actKey, i, actStep);
      let alpha = isSoftmax ? a : Math.min(1.0, Math.max(0.1, a / 2.0));
      if (!intermediateStates || activeStep < actStep) alpha = 0.05;
      
      const isPredicted = isSoftmax && prediction === i && activeStep >= 6;
      
      // Node color intensity based on activation
      const fillColor = isPredicted ? '#10b981' : `rgba(59, 130, 246, ${alpha})`;
      const strokeColor = isPredicted ? '#059669' : (alpha > 0.1 ? '#3b82f6' : '#334155');

      nodes.push(
        <g key={`${name}-${i}`} 
           transform={`translate(${x}, ${y})`} 
           onClick={() => handleNodeClick(layerIdx, name, i, isSoftmax ? 'softmax' : 'relu', isSoftmax)}
           className="cursor-pointer hover:scale-125 transition-transform"
        >
          <circle 
            r={isSoftmax ? 18 : 14} 
            fill={fillColor}
            stroke={strokeColor} 
            strokeWidth={2}
          />
          {isSoftmax && (
            <text x={30} y={6} className={`text-lg font-bold fill-current ${isPredicted ? 'text-emerald-400' : ''}`} style={{ fill: isPredicted ? 'var(--color-emerald-400, #34d399)' : 'var(--text-primary)' }}>
              {i}
            </text>
          )}
        </g>
      );
    }
    return nodes;
  };

  return (
    <div className="flex flex-col w-full h-full relative group">
      {/* Controls - Hide in interactive mode */}
      {!isInteractive && (
        <div className="absolute bottom-4 right-4 z-20 flex items-center justify-center gap-2 bg-[var(--bg-secondary)]/85 backdrop-blur-sm p-2 border border-[var(--border-color)] rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setIsPlaying(!isPlaying)} className="btn-primary py-1 px-3 text-xs" disabled={!intermediateStates}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button 
            onClick={() => setActiveStep(p => Math.min(MAX_STEP, p + 1))} 
            className="btn-secondary py-1 px-3 text-xs"
            disabled={!intermediateStates || activeStep >= MAX_STEP}
          >
            Step
          </button>
          <button onClick={reset} className="btn-secondary py-1 px-3 text-xs">
            Reset
          </button>
        </div>
      )}

      {/* SVG Canvas */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-[var(--bg-primary)]">
        <svg 
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full absolute inset-0"
        >
          <g>
            {/* Input to Dense 1 (Generic faint lines since input is an image) */}
            <g opacity={0.15}>
              {Array.from({length: SAMPLED_HIDDEN_COUNT}).map((_, i) => (
                <line key={`l1-${i}`} x1={LAYER_X.INPUT + 60} y1={dimensions.height / 2} x2={LAYER_X.DENSE1} y2={getHiddenY(i, SAMPLED_HIDDEN_COUNT)} stroke="#888" strokeWidth="1" />
              ))}
            </g>
            
            {/* Dense 1 to Dense 2 */}
            {Array.from({length: SAMPLED_HIDDEN_COUNT}).map((_, i) => (
              Array.from({length: SAMPLED_HIDDEN_COUNT}).map((_, j) => {
                const dense2Weights = weights?.find(w => w.layer_name === 'Dense_2');
                let weight = 0;
                if (dense2Weights) {
                  weight = dense2Weights.weights[i][j];
                }
                
                // Effective contribution = activation * weight
                let sourceAct = getActivation('ReLU_1', i, 2);
                if (!intermediateStates || activeStep < 2) sourceAct = 0.5; // default state
                
                const contribution = sourceAct * weight;
                
                // Hide negligible edges
                if (intermediateStates && activeStep >= 3 && Math.abs(contribution) < 0.05) {
                  return null;
                }
                
                // Color based on weight sign, opacity based on contribution magnitude
                const strokeColor = weight > 0 ? '#3b82f6' : '#ef4444'; // Blue : Red
                let opacity = 0.05 + Math.min(0.7, Math.abs(contribution));
                if (!intermediateStates || activeStep < 3) opacity = Math.min(0.25, Math.abs(weight));
                
                // Keep stroke width subtle (max 1.4px)
                const strokeWidth = Math.min(1.4, Math.max(0.6, opacity * 2));
                
                return (
                  <line 
                    key={`l2-${i}-${j}`} 
                    x1={LAYER_X.DENSE1} y1={getHiddenY(i, SAMPLED_HIDDEN_COUNT)} 
                    x2={LAYER_X.DENSE2} y2={getHiddenY(j, SAMPLED_HIDDEN_COUNT)} 
                    stroke={strokeColor} 
                    opacity={opacity} 
                    strokeWidth={strokeWidth} 
                  />
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
                
                let sourceAct = getActivation('ReLU_3', i, 4);
                if (!intermediateStates || activeStep < 4) sourceAct = 0.5;
                
                const contribution = sourceAct * weight;
                
                // Hide negligible edges
                if (intermediateStates && activeStep >= 5 && Math.abs(contribution) < 0.05) {
                  return null;
                }
                
                const strokeColor = weight > 0 ? '#3b82f6' : '#ef4444';
                let opacity = 0.05 + Math.min(0.8, Math.abs(contribution));
                if (!intermediateStates || activeStep < 5) opacity = Math.min(0.25, Math.abs(weight));
                
                const isPredicted = j === prediction && activeStep >= 6;
                if (isPredicted && contribution > 0) opacity = Math.min(0.9, opacity * 1.5);
                
                // Keep stroke width subtle (max 1.8px)
                const strokeWidth = Math.min(1.8, Math.max(0.6, opacity * 2));
                
                return (
                  <line 
                    key={`l3-${i}-${j}`} 
                    x1={LAYER_X.DENSE2} y1={getHiddenY(i, SAMPLED_HIDDEN_COUNT)} 
                    x2={LAYER_X.OUTPUT} y2={getOutputY(j)} 
                    stroke={strokeColor} 
                    opacity={opacity} 
                    strokeWidth={strokeWidth} 
                  />
                );
              })
            ))}
          </g>

          {/* Layer Headers */}
          <g className="fill-current text-sm font-semibold" style={{ fill: 'var(--text-secondary)' }} textAnchor="middle">
            <text x={LAYER_X.INPUT} y={40}>INPUT LAYER</text>
            <text x={LAYER_X.INPUT} y={60} className="text-xs" style={{ fill: 'var(--text-muted)' }}>(784)</text>
            
            <text x={LAYER_X.DENSE1} y={40}>HIDDEN LAYER 1</text>
            <text x={LAYER_X.DENSE1} y={60} className="text-xs" style={{ fill: 'var(--text-muted)' }}>(128 · ReLU)</text>

            <text x={LAYER_X.DENSE2} y={40}>HIDDEN LAYER 2</text>
            <text x={LAYER_X.DENSE2} y={60} className="text-xs" style={{ fill: 'var(--text-muted)' }}>(64 · ReLU)</text>

            <text x={LAYER_X.OUTPUT} y={40}>OUTPUT LAYER</text>
            <text x={LAYER_X.OUTPUT} y={60} className="text-xs" style={{ fill: 'var(--text-muted)' }}>(10 · Softmax)</text>
          </g>

          {/* Input Layer */}
          <g transform={`translate(${LAYER_X.INPUT - 60}, ${dimensions.height / 2 - 60})`}>
            {inputImageB64 ? (
              <image href={`data:image/png;base64,${inputImageB64}`} width="120" height="120" style={{ imageRendering: 'pixelated' }} className="rounded shadow-sm" />
            ) : (
              <rect width="120" height="120" fill="transparent" stroke="var(--border-color)" strokeWidth="2" strokeDasharray="6" rx="8" />
            )}
          </g>

          {/* Dense 1 */}
          {renderHiddenLayer(LAYER_X.DENSE1, SAMPLED_HIDDEN_COUNT, 'Dense 1', 0, 2, 'ReLU_1')}

          {/* Dense 2 */}
          {renderHiddenLayer(LAYER_X.DENSE2, SAMPLED_HIDDEN_COUNT, 'Dense 2', 2, 4, 'ReLU_3')}

          {/* Output */}
          {renderHiddenLayer(LAYER_X.OUTPUT, OUTPUT_COUNT, 'Output', 4, 6, 'Softmax_5', true)}

          {/* Legend */}
          <g transform={`translate(${Math.max(10, dimensions.width / 2 - 250)}, ${dimensions.height - 20})`} className="text-xs font-mono fill-current" style={{ fill: 'var(--text-muted)' }}>
             <line x1="0" y1="-4" x2="30" y2="-4" stroke="#3b82f6" strokeWidth="3" />
             <text x="40" y="0">Positive weight (activates)</text>
             
             <line x1="220" y1="-4" x2="250" y2="-4" stroke="#ef4444" strokeWidth="3" />
             <text x="260" y="0">Negative weight (inhibits)</text>
             
             <line x1="440" y1="-4" x2="470" y2="-4" stroke="#64748b" strokeWidth="3" />
             <text x="480" y="0">Thickness = |w × a|</text>
          </g>

        </svg>
      </div>
    </div>
  );
}
