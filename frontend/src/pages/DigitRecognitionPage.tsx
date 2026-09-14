import { useState, useEffect } from 'react';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { NetworkVisualizer } from '../components/NetworkVisualizer';
import { NeuronInspector } from '../components/NeuronInspector';
import { ArrowRight, Brain, AlertCircle } from 'lucide-react';
import type { NeuronDetail, AppTab } from '../types/nn';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/v1\/?$/, '');

interface DigitRecognitionPageProps {
  onNavigate: (tab: AppTab) => void;
}

export function DigitRecognitionPage({ onNavigate }: DigitRecognitionPageProps) {
  const [weights, setWeights] = useState<any[] | null>(null);
  const [intermediateStates, setIntermediateStates] = useState<Record<string, number[]> | null>(null);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [probabilities, setProbabilities] = useState<number[] | null>(null);
  const [inputImageB64, setInputImageB64] = useState<string | null>(null);
  const [modelInputB64, setModelInputB64] = useState<string | null>(null);
  const [pixelStats, setPixelStats] = useState<any>(null);
  const [selectedNeuron, setSelectedNeuron] = useState<NeuronDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(API_BASE + '/api/v1/model/weights')
      .then(r => r.json())
      .then(data => {
        if (data.layers) {
          setWeights(data.layers);
        }
      })
      .catch(e => console.error("Failed to fetch weights", e));
  }, []);

  const handlePredict = async (b64Image: string) => {
    setIsLoading(true);
    setError(null);
    setIntermediateStates(null);
    setPrediction(null);
    setProbabilities(null);
    
    try {
      // 1. Preprocess
      const prepRes = await fetch(API_BASE + '/api/v1/dataset/preprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_b64: b64Image })
      });
      
      if (!prepRes.ok) throw new Error('Preprocessing failed');
      const prepData = await prepRes.json();
      setInputImageB64(prepData.thumbnail_b64);
      setModelInputB64(prepData.model_input_b64);
      setPixelStats(prepData.pixel_stats);

      // Reject empty canvas
      if (prepData.flat_array.every((v: number) => v === 0)) {
        setError('Canvas is empty — draw a digit first.');
        setIsLoading(false);
        return;
      }
      
      // 2. Predict
      const predRes = await fetch(API_BASE + '/api/v1/model/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flat_array: prepData.flat_array })
      });
      
      if (!predRes.ok) throw new Error('Prediction failed');
      const predData = await predRes.json();
      
      setPrediction(predData.prediction);
      setProbabilities(predData.probabilities);
      setIntermediateStates(predData.intermediate_states);
      
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setError(null);
    setIntermediateStates(null);
    setPrediction(null);
    setProbabilities(null);
    setInputImageB64(null);
    setModelInputB64(null);
    setPixelStats(null);
    setSelectedNeuron(null);
  };

  return (
    <div className="flex flex-col gap-6 h-full w-full">
      {/* COMPACT PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/20">
            <Brain size={24} className="text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Digit Recognition</h1>
            <p className="text-xs text-[var(--text-secondary)]">Draw a digit and watch it flow through the neural network in real-time.</p>
          </div>
        </div>
        
        <div className="text-right flex flex-col items-end">
          <div className="text-xs font-semibold text-brand-400 uppercase tracking-wider">NumPy Model</div>
          <div className="text-sm font-mono text-[var(--text-secondary)]">784 → 128 → 64 → 10</div>
        </div>
      </div>
      
      {/* 3-COLUMN DASHBOARD GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-[24%_1fr_24%] gap-6 flex-1 min-h-0 w-full overflow-y-auto custom-scrollbar xl:overflow-hidden pb-4 xl:pb-0">
        
        {/* LEFT: Drawing Canvas */}
        <div className="flex flex-col gap-4 min-w-0 h-full">
          <div className="card p-5 flex flex-col items-center shadow-lg w-full">
            <div className="w-full text-left mb-4">
              <h3 className="font-bold text-lg text-[var(--text-primary)]">1. Draw a Digit</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Draw a digit (0–9) in the canvas below.</p>
            </div>
            
            <DrawingCanvas onPredict={handlePredict} onClear={handleClear} disabled={isLoading} autoPredict={true} />
            
            {error && (
              <div className="mt-4 flex items-start gap-2 text-red-500 text-sm p-3 bg-red-500/10 rounded-lg w-full">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
          
          {/* Model Input Preview */}
          {inputImageB64 && modelInputB64 && pixelStats && (
            <div className="card p-5 shadow-lg flex flex-col items-center w-full">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-[var(--text-muted)] w-full text-left mb-4">
                Processed Input (28 × 28)
              </h3>
              
              <div className="flex gap-4 sm:gap-6 items-end justify-center w-full">
                <div className="flex flex-col items-center gap-2">
                  <img src={`data:image/png;base64,${inputImageB64}`} alt="Thumbnail" className="w-16 h-16 sm:w-20 sm:h-20 border border-[var(--border-color)] bg-white rounded-md" style={{ imageRendering: 'pixelated' }} />
                  <span className="text-[10px] sm:text-xs font-semibold text-[var(--text-secondary)]">Your Drawing</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <img src={`data:image/png;base64,${modelInputB64}`} alt="Model Input" className="w-16 h-16 sm:w-20 sm:h-20 border border-[var(--border-color)] bg-black rounded-md" style={{ imageRendering: 'pixelated' }} />
                  <span className="text-[10px] sm:text-xs font-semibold text-[var(--text-secondary)]">Model Input</span>
                </div>
              </div>
              
              <div className="mt-5 w-full text-xs text-[var(--text-secondary)] space-y-1.5 p-3 bg-[var(--bg-primary)] rounded-md border border-[var(--border-color)]">
                <div className="flex justify-between"><span>Shape:</span> <span className="font-mono">28 × 28</span></div>
                <div className="flex justify-between"><span>Range:</span> <span className="font-mono">{(pixelStats.min || 0).toFixed(3)} – {(pixelStats.max || 1).toFixed(3)}</span></div>
                <div className="flex justify-between"><span>Preprocessing:</span> <span className="font-mono">MNIST</span></div>
              </div>
            </div>
          )}

          {selectedNeuron && (
            <div className="card p-4 shadow-lg w-full shrink-0">
              <NeuronInspector neuron={selectedNeuron} />
            </div>
          )}
        </div>
        
        {/* CENTER: Interactive Network Visualizer */}
        <div className="card flex flex-col min-w-0 shadow-lg overflow-hidden relative h-full">
          <div className="px-5 py-4 border-b border-[var(--border-color)] shrink-0 z-10 bg-[var(--bg-card)]">
            <h3 className="font-bold text-lg text-[var(--text-primary)]">
              2. Neural Network Forward Pass
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Watch your input flow through each layer.</p>
          </div>
          <div className="flex-1 w-full min-h-[500px] xl:min-h-0 relative bg-[var(--bg-primary)] overflow-hidden">
            <NetworkVisualizer 
              intermediateStates={intermediateStates}
              weights={weights}
              inputImageB64={inputImageB64}
              onSelectNeuron={setSelectedNeuron}
              prediction={prediction}
            />
          </div>
        </div>
        
        {/* RIGHT: Prediction Panel */}
        <div className="flex flex-col gap-4 min-w-0 h-full">
          <div className="card p-6 shadow-lg h-full flex flex-col w-full">
            <div className="w-full text-left mb-6 shrink-0">
              <h3 className="font-bold text-lg text-[var(--text-primary)]">3. Prediction Result</h3>
            </div>
            
            {prediction !== null && probabilities ? (
              <div className="flex flex-col flex-1">
                <div className="flex flex-col items-center justify-center py-4 shrink-0">
                  <div className="text-9xl font-black text-brand-400 leading-none drop-shadow-md">
                    {prediction}
                  </div>
                  
                  {(() => {
                    const conf = probabilities[prediction];
                    let label = "Low Confidence";
                    let colorClass = "text-red-400 bg-red-400/10 border-red-400/20";
                    let msg = "Try drawing the digit more clearly in the center.";
                    
                    if (conf >= 0.9) {
                      label = "High Confidence";
                      colorClass = "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
                      msg = "The network is very sure about this.";
                    } else if (conf >= 0.6) {
                      label = "Moderate Confidence";
                      colorClass = "text-amber-400 bg-amber-400/10 border-amber-400/20";
                      msg = "The network is somewhat sure.";
                    }
                    
                    return (
                      <div className="flex flex-col items-center mt-6 gap-2 w-full">
                        <div className={`px-4 py-2 rounded-lg text-sm font-bold border ${colorClass} w-full text-center`}>
                          {label}: {(conf * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-[var(--text-muted)] text-center px-2 mt-1">
                          {msg}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                <div className="flex-1 flex flex-col justify-end gap-2 mt-8">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    Class Probabilities
                  </h4>
                  {probabilities.map((prob, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className={`w-3 font-mono ${i === prediction ? 'text-brand-400 font-bold' : 'text-[var(--text-secondary)]'}`}>
                        {i}
                      </span>
                      <div className="flex-1 h-2.5 rounded-full bg-[var(--bg-primary)] overflow-hidden border border-[var(--border-color)]">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${i === prediction ? 'bg-brand-500' : 'bg-[var(--text-muted)] opacity-50'}`}
                          style={{ width: `${Math.max(1, prob * 100)}%` }}
                        />
                      </div>
                      <span className={`w-12 text-right font-mono text-xs ${i === prediction ? 'text-brand-400 font-bold' : 'text-[var(--text-muted)]'}`}>
                        {(prob * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                <div className="w-24 h-24 rounded-full border-4 border-dashed border-[var(--border-color)] flex items-center justify-center mb-4 text-[var(--text-muted)]">
                  ?
                </div>
                <p className="text-[var(--text-secondary)]">Draw a digit on the canvas to see the network's prediction.</p>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
