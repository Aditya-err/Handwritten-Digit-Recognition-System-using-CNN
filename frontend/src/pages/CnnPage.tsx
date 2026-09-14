import { useState, useRef } from 'react';
import { Layers, Activity, Maximize2, ArrowRight } from 'lucide-react';
import { DrawingCanvas } from '../components/DrawingCanvas';
import { FeatureMapRenderer } from '../components/FeatureMapRenderer';
import type { PredictionResult } from '../types/nn';

type SelectedMap = {
  layerName: string;
  channelIndex: number;
  width: number;
  height: number;
  data: number[];
} | null;

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/v1\/?$/, '');

export function CnnPage() {
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [isInferencing, setIsInferencing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMap, setSelectedMap] = useState<SelectedMap>(null);

  const lastProcessedRef = useRef<string | null>(null);

  const handleClear = () => {
    setPredictionResult(null);
    setError(null);
    setSelectedMap(null);
    lastProcessedRef.current = null;
  };

  const handlePredict = async (b64Image: string) => {
    if (isInferencing) return;
    
    setIsInferencing(true);
    setError(null);

    try {
      // 1. Preprocess
      const prepRes = await fetch(API_BASE + '/api/v1/dataset/preprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_b64: b64Image })
      });
      
      if (!prepRes.ok) throw new Error('Preprocessing failed');
      const prepData = await prepRes.json();
      
      const flatArray = prepData.flat_array;
      const base64DataUrl = prepData.thumbnail_b64;

      const currentSig = flatArray.slice(0, 10).join(',') + flatArray.slice(-10).join(',');
      if (lastProcessedRef.current === currentSig) {
        setIsInferencing(false);
        return;
      }
      lastProcessedRef.current = currentSig;

      if (flatArray.every((v: number) => v === 0)) {
        handleClear();
        setIsInferencing(false);
        return;
      }

      // 2. Predict with CNN
      const predRes = await fetch(API_BASE + '/api/v1/cnn/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flat_array: flatArray }),
      });

      if (!predRes.ok) {
        throw new Error('Prediction API failed');
      }

      const predData = await predRes.json();
      predData.processed_image_b64 = base64DataUrl;
      setPredictionResult(predData);

      // Deselect map if the new inference changes dimensions (rare, but safe)
      if (selectedMap) {
         // keep it selected, the data will update if we had a way to map it, 
         // but for simplicity let's just clear selection on new draw, or re-select.
         // Actually, let's try to preserve selection:
         const newStates = predData.intermediate_states;
         if (newStates && newStates[selectedMap.layerName]) {
             const layerData = newStates[selectedMap.layerName];
             const size = selectedMap.width * selectedMap.height;
             const startIdx = selectedMap.channelIndex * size;
             const channelData = layerData.slice(startIdx, startIdx + size);
             setSelectedMap({
                 ...selectedMap,
                 data: channelData
             });
         }
      }

    } catch (e: any) {
      console.error(e);
      setError('Inference failed. Is the backend running?');
    } finally {
      setIsInferencing(false);
    }
  };

  // Helper to slice 1D array into feature maps
  const getFeatureMaps = (layerData: number[], channels: number, width: number, height: number) => {
    const maps = [];
    const size = width * height;
    for (let i = 0; i < channels; i++) {
      maps.push(layerData.slice(i * size, (i + 1) * size));
    }
    return maps;
  };

  const getMapStats = (data: number[]) => {
    if (!data || data.length === 0) return { min: 0, max: 0, mean: 0 };
    let min = data[0];
    let max = data[0];
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] < min) min = data[i];
      if (data[i] > max) max = data[i];
      sum += data[i];
    }
    return { min, max, mean: sum / data.length };
  };

  // Render a block of feature maps
  const renderLayerGroup = (
    title: string, 
    layerName: string, 
    data: number[] | undefined, 
    channels: number, 
    width: number, 
    height: number,
    explanation: string
  ) => {
    if (!data) return null;
    
    const maps = getFeatureMaps(data, channels, width, height);
    
    // Calculate global min/max for this layer so colors are comparable
    const globalMin = Math.min(...data);
    const globalMax = Math.max(...data);

    return (
      <div className="card p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Layers className="text-brand-500" size={20} />
              {title}
            </h3>
            <div className="text-sm font-mono text-[var(--text-muted)] mb-4">
              Shape: ({channels}, {width}, {height})
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {explanation}
            </p>
          </div>
          
          <div className="w-full md:w-2/3">
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {maps.map((mapData, idx) => {
                const isSelected = selectedMap?.layerName === layerName && selectedMap?.channelIndex === idx;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <FeatureMapRenderer
                      data={mapData}
                      width={width}
                      height={height}
                      canvasSize={48}
                      globalMin={globalMin}
                      globalMax={globalMax}
                      selected={isSelected}
                      onClick={() => setSelectedMap({
                        layerName,
                        channelIndex: idx,
                        width,
                        height,
                        data: mapData
                      })}
                    />
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">{idx}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const intermediates = predictionResult?.intermediate_states;

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto h-full pb-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20">
            <Activity size={24} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">CNN Feature Maps</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Visualize how the PyTorch Convolutional Neural Network extracts features layer by layer.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* Left Column: Input and Maps */}
        <div className="flex-1 w-full min-w-0">
          
          {/* Draw Input */}
          <div className="card p-6 mb-8 flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full max-w-[280px]">
              <h3 className="font-semibold mb-4 text-[var(--text-secondary)] text-center">Draw a digit</h3>
              <DrawingCanvas 
                onPredict={handlePredict} 
                onClear={handleClear}
                disabled={isInferencing}
              />
            </div>
            
            <div className="hidden md:flex flex-col items-center opacity-30 px-4">
              <ArrowRight size={32} />
            </div>

            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold mb-2">Input Image</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                The drawn image is scaled down to 28×28 pixels and normalized to grayscale values between 0.0 and 1.0. This is the raw input passed into the CNN.
              </p>
              
              {predictionResult ? (
                <div className="flex items-center justify-center md:justify-start gap-6">
                  <div className="text-center">
                    <img 
                      src={predictionResult.processed_image_b64} 
                      className="w-[112px] h-[112px] border border-[var(--border-color)] bg-black image-pixelated rounded"
                      alt="Processed input" 
                    />
                    <div className="text-xs text-[var(--text-muted)] mt-2 font-mono">1 × 28 × 28</div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] min-w-[120px]">
                    <div className="text-sm text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Prediction</div>
                    <div className="text-5xl font-bold text-brand-400">{predictionResult.prediction}</div>
                  </div>
                </div>
              ) : (
                <div className="h-[112px] flex items-center justify-center md:justify-start text-[var(--text-muted)]">
                  Waiting for input...
                </div>
              )}
            </div>
          </div>

          {/* CNN Layers */}
          {predictionResult && intermediates ? (
            <div className="animate-fade-in">
              {renderLayerGroup(
                "Conv1 + ReLU", 
                "conv1_activation", 
                intermediates["conv1_activation"], 
                8, 28, 28,
                "The first convolutional layer uses 8 kernels (3×3) to scan the input image. It typically learns to detect simple local features like edges, curves, or lines. The ReLU activation function replaces any negative values with zero, introducing non-linearity."
              )}

              {renderLayerGroup(
                "MaxPool 1", 
                "pool1_output", 
                intermediates["pool1_output"], 
                8, 14, 14,
                "Max pooling reduces the spatial dimensions by taking the maximum value in each 2×2 window. This reduces computational cost, controls overfitting, and provides translation invariance (making the network less sensitive to the exact position of features)."
              )}

              {renderLayerGroup(
                "Conv2 + ReLU", 
                "conv2_activation", 
                intermediates["conv2_activation"], 
                16, 14, 14,
                "The second convolutional layer has 16 kernels. Since it takes the pooled output of Conv1 as input, its receptive field is larger. It combines the simple edges from the first layer into more complex shapes like loops or intersections."
              )}

              {renderLayerGroup(
                "MaxPool 2", 
                "pool2_output", 
                intermediates["pool2_output"], 
                16, 7, 7,
                "A second max pooling operation further shrinks the feature maps to 7×7. These dense, abstract representations are then flattened into a 1D array of 784 values and passed to the final Fully Connected (Linear) layer to classify the digit."
              )}
            </div>
          ) : null}

        </div>

        {/* Right Column: Inspector */}
        <div className="w-full xl:w-80 shrink-0">
          <div className="card p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-4 border-b border-[var(--border-color)] pb-3">
              <Maximize2 size={18} className="text-[var(--text-muted)]" />
              <h3 className="font-bold">Feature Map Inspector</h3>
            </div>
            
            {selectedMap ? (
              <div className="animate-fade-in flex flex-col gap-6">
                <div className="flex justify-center bg-[var(--bg-secondary)] p-4 rounded-lg border border-[var(--border-color)]">
                  <FeatureMapRenderer
                    data={selectedMap.data}
                    width={selectedMap.width}
                    height={selectedMap.height}
                    canvasSize={160}
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Layer</span>
                    <span className="font-mono text-sm">{selectedMap.layerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Channel</span>
                    <span className="font-mono text-sm">{selectedMap.channelIndex}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Dimensions</span>
                    <span className="font-mono text-sm">{selectedMap.width} × {selectedMap.height}</span>
                  </div>
                  
                  <div className="pt-3 border-t border-[var(--border-color)]">
                    <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Statistics</h4>
                    
                    {(() => {
                      const stats = getMapStats(selectedMap.data);
                      return (
                        <div className="space-y-1 font-mono text-sm">
                          <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">Min:</span>
                            <span className="text-blue-400">{stats.min.toFixed(4)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">Max:</span>
                            <span className="text-red-400">{stats.max.toFixed(4)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">Mean:</span>
                            <span>{stats.mean.toFixed(4)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <p className="text-sm">Select any feature map to inspect it closely.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
