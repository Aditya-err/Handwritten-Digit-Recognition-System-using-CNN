import { useState, useEffect } from 'react';
import { NetworkVisualizer } from '../components/NetworkVisualizer';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { NeuronInspector } from '../components/NeuronInspector';
import type { NeuronDetail } from '../types/nn';
import { Activity } from 'lucide-react';

export function NetworkPage() {
  const [weights, setWeights] = useState<any[] | null>(null);
  const [intermediateStates, setIntermediateStates] = useState<Record<string, number[]> | null>(null);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [inputImageB64, setInputImageB64] = useState<string | null>(null);
  const [selectedNeuron, setSelectedNeuron] = useState<NeuronDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch weights on mount
    fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/v1/model/weights')
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
      const prepRes = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/v1/dataset/preprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_b64: b64Image })
      });
      
      if (!prepRes.ok) throw new Error('Preprocessing failed');
      const prepData = await prepRes.json();
      setInputImageB64(prepData.thumbnail_b64);
      
      // 2. Predict
      const predRes = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/v1/model/predict', {
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
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto h-full">
      <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20">
          <Activity size={24} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Interactive Network Visualizer</h1>
          <p className="text-sm text-[var(--text-secondary)]">Draw a digit and trace its forward pass through the hidden layers.</p>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Canvas & Controls */}
        <div className="flex flex-col gap-4 shrink-0">
          <div className="card p-4 flex flex-col items-center">
            <h3 className="font-semibold mb-4 self-start text-sm uppercase tracking-wider text-[var(--text-muted)]">Input Layer</h3>
            <DrawingCanvas onPredict={handlePredict} disabled={isLoading} />
            {error && <div className="mt-4 text-red-500 text-sm p-2 bg-red-500/10 rounded">{error}</div>}
          </div>
          
          {prediction !== null && (
            <div className="card p-4 flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">Prediction</span>
              <span className="text-4xl font-bold text-emerald-500">{prediction}</span>
            </div>
          )}
        </div>
        
        {/* Middle Column: Visualizer */}
        <div className="flex-1 w-full min-w-0">
          <NetworkVisualizer 
            intermediateStates={intermediateStates}
            weights={weights}
            inputImageB64={inputImageB64}
            onSelectNeuron={setSelectedNeuron}
            prediction={prediction}
          />
        </div>
        
        {/* Right Column: Inspector */}
        <div className="w-[300px] shrink-0 self-stretch">
          <NeuronInspector neuron={selectedNeuron} />
        </div>
      </div>
    </div>
  );
}
