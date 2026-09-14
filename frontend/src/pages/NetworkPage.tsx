import { useState, useEffect } from 'react';
import { NetworkVisualizer } from '../components/NetworkVisualizer';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { NeuronInspector } from '../components/NeuronInspector';
import type { NeuronDetail, AppTab } from '../types/nn';
import { Activity } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/v1\/?$/, '');

interface NetworkPageProps {
  onNavigate: (tab: AppTab) => void;
}

export function NetworkPage({ onNavigate }: NetworkPageProps) {
  const [weights, setWeights] = useState<any[] | null>(null);
  const [intermediateStates, setIntermediateStates] = useState<Record<string, number[]> | null>(null);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [inputImageB64, setInputImageB64] = useState<string | null>(null);
  const [selectedNeuron, setSelectedNeuron] = useState<NeuronDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch weights on mount
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
    setSelectedNeuron(null);
    
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

      // Guard: reject blank drawings (all-zero flat array = empty canvas)
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
      setIntermediateStates(predData.intermediate_states);
      
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3 shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20">
          <Activity size={24} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-tight">Interactive Network Visualizer</h1>
          <p className="text-xs text-[var(--text-secondary)]">Explore the neural network and inspect individual neurons.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 flex-1 min-h-0 w-full overflow-y-auto xl:overflow-hidden pb-4 xl:pb-0 custom-scrollbar">
        
        {/* Left Column: Visualizer */}
        <div className="card flex flex-col min-w-0 shadow-lg overflow-hidden h-full">
          <div className="px-5 py-3 border-b border-[var(--border-color)] shrink-0 z-10 bg-[var(--bg-card)]">
            <h3 className="font-bold text-base text-[var(--text-primary)]">Large Network View</h3>
          </div>
          <div className="flex-1 w-full min-h-[500px] xl:min-h-0 relative bg-[var(--bg-primary)] overflow-hidden">
            <NetworkVisualizer 
              intermediateStates={intermediateStates}
              weights={weights}
              inputImageB64={inputImageB64}
              onSelectNeuron={setSelectedNeuron}
              prediction={prediction}
              isInteractive={false}
            />
          </div>
        </div>
        
        {/* Right Column: Canvas & Inspector */}
        <div className="flex flex-col w-full h-full min-w-0 gap-6">
          <div className="card p-4 flex flex-col items-center shadow-lg w-full shrink-0">
            <div className="flex justify-between w-full items-center mb-3">
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Input Layer</h3>
                <p className="text-xs text-[var(--text-secondary)]">Draw a digit to test.</p>
              </div>
              {prediction !== null && (
                <div className="text-right flex flex-col items-end">
                  <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-bold">Prediction</span>
                  <span className="text-2xl font-bold text-emerald-500 leading-none">{prediction}</span>
                </div>
              )}
            </div>
            <DrawingCanvas onPredict={handlePredict} disabled={isLoading} />
            {error && <div className="mt-4 text-red-500 text-xs p-2 bg-red-500/10 rounded-lg w-full">{error}</div>}
          </div>
          
          <div className="card p-5 shadow-lg flex-1 flex flex-col min-h-0">
            <h3 className="font-bold text-base text-[var(--text-primary)] mb-4 shrink-0">Neuron Inspector</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {selectedNeuron ? (
                <NeuronInspector neuron={selectedNeuron} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-50 px-4">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-[var(--border-color)] flex items-center justify-center mb-4 text-[var(--text-muted)]">
                    ?
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">Select a neuron in the network to inspect its state and math.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
