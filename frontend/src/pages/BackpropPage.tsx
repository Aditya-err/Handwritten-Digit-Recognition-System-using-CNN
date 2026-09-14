const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/v1\/?$/, '');

import { useState, useEffect, useRef } from 'react';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { WeightMapRenderer } from '../components/WeightMapRenderer';
import { Loader2, Zap, ArrowRight, FastForward, Calculator, Info } from 'lucide-react';
import type { AppTab, BackpropResponse } from '../types/nn';

type BackpropState = 
  | 'IDLE' 
  | 'COMPUTING'
  | 'FORWARD_PASS' 
  | 'LOSS' 
  | 'OUTPUT_GRADIENT' 
  | 'BACKPROP_L3' 
  | 'BACKPROP_L2' 
  | 'BACKPROP_L1' 
  | 'WEIGHT_UPDATE';

interface BackpropPageProps {
  onNavigate?: (tab: AppTab) => void;
}

export function BackpropPage({ onNavigate }: BackpropPageProps) {
  const [targetClass, setTargetClass] = useState<number>(0);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [response, setResponse] = useState<BackpropResponse | null>(null);
  
  const [step, setStep] = useState<BackpropState>('IDLE');
  const [selectedNeuron, setSelectedNeuron] = useState<number | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<{row: number, col: number} | null>(null);
  const [learningRate, setLearningRate] = useState<number>(0.1);
  
  // Cache weights since they aren't part of the response currently 
  // Wait, the API returns gradients but does it return the original weights? 
  // Ah, the API only returns d_weights, not the original weights in the backprop response!
  // I need to fetch the original weights via /model/weights if I want to show W_new = W_old - lr * dW.
  const [weightsMap, setWeightsMap] = useState<Record<string, {weights: number[][], biases: number[]}> | null>(null);
  
  const activeControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch(API_BASE + '/api/v1/model/weights')
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        const map: Record<string, {weights: number[][], biases: number[]}> = {};
        for (const layer of data.layers) {
          // backend WeightsResponse layers have weights shape [input, output].
          // WeightMapRenderer expects shape [rows, cols] where rows=neurons(output), cols=inputs.
          // We must transpose the weights from the backend.
          const transposed = transpose(layer.weights);
          map[layer.layer_name] = { weights: transposed, biases: layer.biases };
        }
        setWeightsMap(map);
      })
      .catch(err => console.error("Failed to load weights", err));
      
    return () => {
      isMounted = false;
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
    };
  }, []);
  
  const transpose = (matrix: number[][]) => {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
  };

  const handleRunBackprop = async (b64Image: string) => {
    setLoading(true);
    setError(null);
    setStep('COMPUTING');
    setResponse(null);
    setSelectedNeuron(null);
    setSelectedWeight(null);
    
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
    }
    const controller = new AbortController();
    activeControllerRef.current = controller;
    
    try {
      // 1. Preprocess
      const prepRes = await fetch(`${API_BASE}/api/v1/dataset/preprocess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_b64: b64Image }),
        signal: controller.signal
      });
      if (!prepRes.ok) throw new Error('Preprocessing failed');
      const prepData = await prepRes.json();
      const processedFlat = prepData.flat_array;

      const res = await fetch(API_BASE + '/api/v1/model/backprop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flat_array: processedFlat, target_class: targetClass }),
        signal: controller.signal
      });
      
      if (!res.ok) throw new Error("Failed to compute backprop");
      const data = (await res.json()) as BackpropResponse;
      
      // Transpose gradients from backend
      if (data.gradients) {
        for (const layerName in data.gradients) {
           data.gradients[layerName].weights = transpose(data.gradients[layerName].weights);
        }
      }
      
      setResponse(data);
      setStep('FORWARD_PASS');
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Failed to connect to backend.');
      setStep('IDLE');
    } finally {
      setLoading(false);
    }
  };
  
  const steps: BackpropState[] = [
    'FORWARD_PASS', 'LOSS', 'OUTPUT_GRADIENT', 
    'BACKPROP_L3', 'BACKPROP_L2', 'BACKPROP_L1', 'WEIGHT_UPDATE'
  ];
  
  const handleNextStep = () => {
    const idx = steps.indexOf(step);
    if (idx >= 0 && idx < steps.length - 1) {
      setStep(steps[idx + 1]);
      setSelectedNeuron(null);
      setSelectedWeight(null);
    }
  };
  
  // Renders the math/educational content for the current step
  const renderStepContent = () => {
    if (!response) return null;
    
    switch (step) {
      case 'FORWARD_PASS':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold flex items-center gap-2"><Zap className="text-yellow-400"/> 1. Forward Pass</h3>
            <p className="text-[var(--text-secondary)]">
              The network processes the image and outputs probabilities for each digit.
            </p>
            <div className="p-4 bg-brand-500/10 rounded-lg border border-brand-500/20">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Prediction:</span>
                <span className="text-2xl font-bold text-brand-400">{response.prediction}</span>
              </div>
              <div className="flex justify-between items-center mb-4 border-b border-brand-500/20 pb-4">
                <span className="font-semibold">Target Class:</span>
                <span className="text-xl font-bold">{targetClass}</span>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2 text-sm">Class Probabilities:</h4>
                <div className="grid grid-cols-5 gap-2">
                  {response.probabilities.map((prob, idx) => (
                    <div key={idx} className="flex flex-col items-center bg-white dark:bg-zinc-900 rounded p-1 border border-[var(--border-color)]">
                      <span className="font-bold text-xs">{idx}</span>
                      <span className="font-mono text-xs text-[var(--text-muted)]">{prob.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'LOSS':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold flex items-center gap-2"><Calculator className="text-red-400"/> 2. Calculate Loss</h3>
            <p className="text-[var(--text-secondary)]">
              Categorical Cross-Entropy measures how far the predicted probabilities are from the true target.
            </p>
            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-mono text-sm space-y-2">
              <div>L = -log(P_{targetClass})</div>
              <div>P_{targetClass} = {response.probabilities[targetClass].toFixed(4)}</div>
              <div className="text-red-500 font-bold border-t border-zinc-300 dark:border-zinc-700 pt-2 mt-2">
                Loss = {response.loss.toFixed(4)}
              </div>
            </div>
          </div>
        );
        
      case 'OUTPUT_GRADIENT':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold">3. Output Gradient (dL/dz)</h3>
            <p className="text-[var(--text-secondary)]">
              The gradient at the output layer is simply (Prediction - Target).
              This tells the network which probabilities need to go up (negative gradient) and which need to go down (positive gradient).
            </p>
            <div className="grid grid-cols-5 gap-2">
              {response.output_gradient.map((g, i) => (
                <div key={i} className="flex flex-col items-center p-2 rounded bg-white dark:bg-zinc-900 border border-[var(--border-color)]">
                  <div className="font-bold">{i}</div>
                  <div className={`text-xs ${g < 0 ? 'text-red-500' : g > 0 ? 'text-blue-500' : 'text-gray-500'}`}>
                    {g.toFixed(3)}
                  </div>
                  {/* Small bar chart */}
                  <div className="w-full h-12 bg-gray-100 dark:bg-zinc-800 mt-2 relative flex items-center justify-center">
                     <div 
                       className={`absolute w-full ${g < 0 ? 'bg-red-500' : 'bg-blue-500'}`} 
                       style={{ 
                         height: `${Math.min(100, Math.abs(g)*100)}%`,
                         bottom: g < 0 ? '50%' : undefined,
                         top: g > 0 ? '50%' : undefined
                       }}
                     />
                     <div className="w-full h-[1px] bg-gray-400 absolute top-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'BACKPROP_L3':
      case 'BACKPROP_L2':
      case 'BACKPROP_L1':
        const layerMap: Record<string, string> = {
          'BACKPROP_L3': 'Dense_4',
          'BACKPROP_L2': 'Dense_2',
          'BACKPROP_L1': 'Dense_0'
        };
        const lName = layerMap[step];
        const layerGrads = response.gradients[lName];
        const layerWeights = weightsMap?.[lName];
        
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold flex justify-between items-center">
              <span>Backpropagating to {lName}</span>
              <span className="text-sm font-normal px-2 py-1 bg-brand-500/20 text-brand-500 rounded">
                Shape: {layerGrads.weights.length} × {layerGrads.weights[0].length}
              </span>
            </h3>
            <p className="text-[var(--text-secondary)]">
              Visualizing the gradient matrix <strong>dW</strong>. Click a row to select a neuron, or click an exact pixel to inspect the weight and gradient.
              Red = negative gradient (weight should increase). Blue = positive gradient (weight should decrease).
            </p>
            
            {layerWeights && (
              <WeightMapRenderer
                weights={layerWeights.weights}
                gradients={layerGrads.weights}
                canvasHeight={step === 'BACKPROP_L1' ? 600 : 300}
                selectedRow={selectedNeuron}
                onNeuronSelect={setSelectedNeuron}
                onWeightSelect={(r, c) => setSelectedWeight({row: r, col: c})}
              />
            )}
            
            {selectedWeight && layerWeights && (
              <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg border-l-4 border-brand-500 mt-4 animate-in slide-in-from-left-2">
                <h4 className="font-bold mb-2">Weight Inspector</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Neuron</div>
                    <div className="font-mono">{selectedWeight.row}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Input Connection</div>
                    <div className="font-mono">{selectedWeight.col}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Current Weight (W_old)</div>
                    <div className="font-mono">{layerWeights.weights[selectedWeight.row][selectedWeight.col].toFixed(6)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Gradient (dW)</div>
                    <div className="font-mono">{layerGrads.weights[selectedWeight.row][selectedWeight.col].toFixed(6)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'WEIGHT_UPDATE':
        if (!selectedWeight || !weightsMap) {
          return (
             <div className="space-y-4">
                <h3 className="text-xl font-bold">Weight Update Simulation</h3>
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-lg flex items-start gap-2 text-sm">
                  <Info size={18} className="shrink-0 mt-0.5" />
                  <span>Please go back to a layer and select a specific weight to simulate the update!</span>
                </div>
             </div>
          );
        }
        
        // Find which layer the selected weight belongs to based on the size or last inspected step
        // We'll just assume the last inspected layer.
        const prevStepMap: Record<string, string> = {
          'BACKPROP_L3': 'Dense_4',
          'BACKPROP_L2': 'Dense_2',
          'BACKPROP_L1': 'Dense_0'
        };
        // It's a bit hacky to rely on the fact that selectedWeight persists, but it works for the flow.
        
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold text-brand-400">Final Step: Weight Update Simulation</h3>
            <div className="text-sm bg-amber-500/10 border border-amber-500/20 text-amber-500 p-3 rounded-lg flex gap-2">
              <Info size={16} className="shrink-0 mt-0.5" />
              <span>
                <strong>Educational Simulation:</strong> The weight updates shown below are simulated for visualization purposes only. 
                They do <strong>not</strong> permanently modify the pretrained production model.
              </span>
            </div>
            <p className="text-[var(--text-secondary)] mt-2">
              The gradient defines the direction of steepest ascent. We subtract the gradient (scaled by learning rate) to minimize the loss.
            </p>
            
            <div className="p-6 bg-zinc-100 dark:bg-zinc-800 rounded-xl space-y-6 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Learning Rate (α)</span>
                <span className="font-mono bg-white dark:bg-black px-2 py-1 rounded">{learningRate.toFixed(4)}</span>
              </div>
              <input 
                type="range" 
                min="0.001" max="1.0" step="0.001"
                value={learningRate}
                onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                className="w-full accent-brand-500"
              />
              
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg font-mono text-center overflow-x-auto text-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
                <div className="text-sm text-gray-400 mb-2 font-sans text-left uppercase tracking-wider">Formula</div>
                W_new = W_old - (α × dW)
              </div>
              
              {Object.entries(prevStepMap).map(([_, lName]) => {
                const layerWeights = weightsMap[lName];
                const layerGrads = response.gradients[lName];
                
                // Only show if the selected weight indices are valid for this layer
                if (selectedWeight.row < layerWeights.weights.length && selectedWeight.col < layerWeights.weights[0].length) {
                  const w_old = layerWeights.weights[selectedWeight.row][selectedWeight.col];
                  const dW = layerGrads.weights[selectedWeight.row][selectedWeight.col];
                  const w_new = w_old - (learningRate * dW);
                  
                  return (
                    <div key={lName} className="font-mono space-y-2 text-sm bg-blue-500/5 p-4 rounded border border-blue-500/20">
                       <div className="text-brand-500 font-bold mb-2 font-sans border-b border-blue-500/20 pb-2">{lName} Matrix Update</div>
                       <div className="flex justify-between">
                         <span className="text-gray-500">W_old:</span>
                         <span>{w_old.toFixed(6)}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-500">dW:</span>
                         <span className={dW < 0 ? 'text-red-400' : 'text-blue-400'}>{dW.toFixed(6)}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-500">Step (-α × dW):</span>
                         <span>{(-learningRate * dW).toFixed(6)}</span>
                       </div>
                       <div className="flex justify-between font-bold pt-2 border-t border-dashed border-gray-300 dark:border-zinc-700 mt-2 text-base">
                         <span>W_new:</span>
                         <span className="text-green-500">{w_new.toFixed(6)}</span>
                       </div>
                    </div>
                  );
                }
                return null;
              }).filter(Boolean).slice(0, 1)}
              
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Left Column: Input */}
      <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Backpropagation</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-4">
            See the math behind the neural network learning process.
          </p>
          {onNavigate && (
            <button 
              onClick={() => onNavigate('learn')} 
              className="text-xs text-brand-500 hover:underline flex items-center gap-1 mb-4"
            >
              Learn the mathematics of Backprop &rarr;
            </button>
          )}
        </div>
        
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-4 shadow-sm">
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">1. Draw a digit</label>
            <DrawingCanvas 
              onPredict={handleRunBackprop} 
              disabled={loading}
            /></div>
          
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">2. Select Target Class</label>
            <p className="text-xs text-gray-500 mb-2">What label should the network be forced to learn for this drawing?</p>
            <select 
              value={targetClass}
              onChange={(e) => setTargetClass(parseInt(e.target.value))}
              className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 focus:ring-2 focus:ring-brand-500 outline-none"
            >
              {[0,1,2,3,4,5,6,7,8,9].map(n => (
                <option key={n} value={n}>Class {n}</option>
              ))}
            </select>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm border border-red-500/20">
              {error}
            </div>
          )}
        </div>
      </div>
      
      {/* Right Column: Educational Flow */}
      <div className="flex-1 min-w-0 flex flex-col">
        {step === 'IDLE' || step === 'COMPUTING' ? (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-[var(--border-color)] rounded-xl p-12 text-center text-[var(--text-secondary)]">
            {step === 'COMPUTING' ? (
              <div className="flex flex-col items-center gap-4">
                 <Loader2 size={32} className="animate-spin text-brand-500" />
                 <p>Calculating gradients using chain rule...</p>
              </div>
            ) : (
              <div className="max-w-sm">
                <Zap size={48} className="mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
                <h3 className="text-xl font-medium mb-2">Ready for Backprop</h3>
                <p>Draw a digit, choose what the network *should* predict, and run to see the gradients flow backward.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm min-h-[600px] flex flex-col">
             
             {/* Progress Stepper */}
             <div className="flex flex-wrap gap-2 mb-8 border-b border-[var(--border-color)] pb-4">
                {steps.map((s, i) => {
                  const isActive = s === step;
                  const isPast = steps.indexOf(step) > i;
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <div className={`px-2 py-1 text-xs font-bold rounded-full transition-colors ${
                        isActive ? 'bg-brand-500 text-white' : 
                        isPast ? 'bg-brand-500/20 text-brand-400' : 'bg-zinc-200 dark:bg-zinc-800 text-gray-500'
                      }`}>
                        {i + 1}. {s.replace('_', ' ')}
                      </div>
                      {i < steps.length - 1 && <ArrowRight size={14} className="text-gray-400" />}
                    </div>
                  )
                })}
             </div>
             
             {/* Content */}
             <div className="flex-1">
                {renderStepContent()}
             </div>
             
             {/* Next Button */}
             {steps.indexOf(step) < steps.length - 1 && (
               <div className="mt-8 flex justify-end pt-4 border-t border-[var(--border-color)]">
                 <button 
                   onClick={handleNextStep}
                   className="px-6 py-2 bg-zinc-800 text-white dark:bg-zinc-200 dark:text-black rounded-lg font-bold flex items-center gap-2 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
                 >
                   Next Step <FastForward size={16} />
                 </button>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
