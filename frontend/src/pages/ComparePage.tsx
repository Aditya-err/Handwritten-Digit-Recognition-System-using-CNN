import { useState, useRef } from 'react';
import { Scale, ArrowRight, Loader2 } from 'lucide-react';
import { DrawingCanvas } from '../components/DrawingCanvas';
import type { PredictionResult } from '../types/nn';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/v1\/?$/, '');

export function ComparePage() {
  const [numpyResult, setNumpyResult] = useState<PredictionResult | null>(null);
  const [cnnResult, setCnnResult] = useState<PredictionResult | null>(null);
  const [isInferencing, setIsInferencing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce ref to prevent multiple identical inference calls
  const lastProcessedRef = useRef<string | null>(null);

  const handleClear = () => {
    setNumpyResult(null);
    setCnnResult(null);
    setError(null);
    lastProcessedRef.current = null;
  };

  const handlePredict = async (b64Image: string) => {
    // Basic debounce check to prevent too frequent calls if needed
    // In this case, just use a simple flag
    if (isInferencing) return;
    
    setIsInferencing(true);
    setError(null);

    try {
      // 1. Preprocess the image
      const prepRes = await fetch(API_BASE + '/api/v1/dataset/preprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_b64: b64Image })
      });
      
      if (!prepRes.ok) throw new Error('Preprocessing failed');
      const prepData = await prepRes.json();
      
      const flatArray = prepData.flat_array;
      const base64DataUrl = prepData.thumbnail_b64;

      // Reject empty drawings (all zeros)
      if (flatArray.every((v: number) => v === 0)) {
        handleClear();
        return;
      }

      // 2. Run both inferences concurrently
      const [npRes, cnnRes] = await Promise.all([
        fetch(API_BASE + '/api/v1/model/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flat_array: flatArray }),
        }),
        fetch(API_BASE + '/api/v1/cnn/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ flat_array: flatArray }),
        })
      ]);

      if (!npRes.ok || !cnnRes.ok) {
        throw new Error('Prediction API failed');
      }

      const npData = await npRes.json();
      const cnnData = await cnnRes.json();
      
      // Inject the thumbnail data url for the frontend visualization
      npData.processed_image_b64 = base64DataUrl;
      cnnData.processed_image_b64 = base64DataUrl;

      setNumpyResult(npData);
      setCnnResult(cnnData);

    } catch (e: any) {
      console.error(e);
      setError('Inference failed. Is the backend running?');
    } finally {
      setIsInferencing(false);
    }
  };

  const renderModelCard = (title: string, result: PredictionResult | null, accentClass: string, architecture: string) => {
    return (
      <div className={`card p-6 flex flex-col items-center justify-between h-full min-h-[400px] border-t-4 ${accentClass}`}>
        <h2 className="text-xl font-bold mb-1">{title}</h2>
        <div className="text-sm font-mono text-[var(--text-muted)] mb-6 text-center">{architecture}</div>
        
        {isInferencing ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] gap-3">
            <Loader2 size={32} className="animate-spin" />
            <p>Inferencing...</p>
          </div>
        ) : result ? (
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <div className="text-[120px] leading-none font-bold tabular-nums">
              {result.prediction}
            </div>
            <div className="text-xl text-[var(--text-secondary)] mb-6">
              {(result.probabilities[result.prediction] * 100).toFixed(1)}% Confidence
            </div>
            
            <div className="w-full space-y-2 mt-auto">
              <div className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Top 3 Probabilities</div>
              {result.probabilities
                .map((prob, digit) => ({ digit, prob }))
                .sort((a, b) => b.prob - a.prob)
                .slice(0, 3)
                .map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-4 font-mono text-right">{item.digit}</span>
                    <div className="flex-1 h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${idx === 0 ? 'bg-blue-500' : 'bg-[var(--border-color)]'}`} 
                        style={{ width: `${Math.max(2, item.prob * 100)}%` }} 
                      />
                    </div>
                    <span className="w-12 font-mono text-xs text-right text-[var(--text-muted)]">
                      {(item.prob * 100).toFixed(1)}%
                    </span>
                  </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
            Draw a digit below to see prediction
          </div>
        )}
      </div>
    );
  };

  const getAgreementStatus = () => {
    if (!numpyResult || !cnnResult) return null;
    
    const npPred = numpyResult.prediction;
    const cnnPred = cnnResult.prediction;

    if (npPred === cnnPred) {
      return (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 py-3 px-6 rounded-xl text-center font-semibold text-lg animate-fade-in flex items-center justify-center gap-3">
          <Scale size={24} /> Models Agree: {npPred}
        </div>
      );
    } else {
      return (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 py-3 px-6 rounded-xl text-center font-semibold text-lg animate-fade-in flex items-center justify-center gap-3">
          <Scale size={24} /> Models Disagree
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full h-full pb-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20">
            <Scale size={24} className="text-purple-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Model Comparison</h1>
            <p className="text-sm text-[var(--text-secondary)]">NumPy fully-connected NN vs PyTorch CNN.</p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Shared Input Area */}
      <div className="flex flex-col items-center pt-2">
        <div className="card p-5 shadow-lg w-full max-w-[360px] flex flex-col items-center">
          <h3 className="font-bold text-sm text-[var(--text-primary)] w-full text-center uppercase tracking-wider mb-4">Shared Input</h3>
          <DrawingCanvas 
            onPredict={handlePredict} 
            disabled={isInferencing}
            autoPredict={false}
          />
        </div>
      </div>
      
      {getAgreementStatus()}

      {/* Comparison Area */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch flex-1 min-h-0">
        <div className="w-full h-full">
          {renderModelCard("NumPy Neural Network", numpyResult, "border-t-blue-500", "784 → 128 → 64 → 10")}
        </div>
        
        <div className="w-full h-full">
          {renderModelCard("PyTorch CNN", cnnResult, "border-t-purple-500", "Conv2D → Pool → Conv2D → Pool → 10")}
        </div>
      </div>
      
    </div>
  );
}
