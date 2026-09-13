import { useEffect, useRef } from 'react';

// A simple Viridis colormap approximation for heatmap rendering
// Values range from 0 to 1
function getViridisColor(v: number): [number, number, number] {
  // Clamp
  v = Math.max(0, Math.min(1, v));
  
  // A standard viridis mapping is complex, let's use a simpler known interpolation:
  // v=0 -> #440154 (68, 1, 84)
  // v=0.5 -> #21918c (33, 145, 140)
  // v=1 -> #fde725 (253, 231, 37)
  
  if (v < 0.5) {
    const t = v * 2.0;
    return [
      68 + t * (33 - 68),
      1 + t * (145 - 1),
      84 + t * (140 - 84)
    ];
  } else {
    const t = (v - 0.5) * 2.0;
    return [
      33 + t * (253 - 33),
      145 + t * (231 - 145),
      140 + t * (37 - 140)
    ];
  }
}

interface FeatureMapRendererProps {
  data: number[]; // Flat array representing a 2D grid
  width: number;
  height: number;
  canvasSize?: number; // Output canvas CSS size
  globalMin?: number;
  globalMax?: number;
  onClick?: () => void;
  selected?: boolean;
}

export function FeatureMapRenderer({
  data,
  width,
  height,
  canvasSize = 48,
  globalMin,
  globalMax,
  onClick,
  selected = false
}: FeatureMapRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate local min/max if global not provided
    let min = globalMin !== undefined ? globalMin : Math.min(...data);
    let max = globalMax !== undefined ? globalMax : Math.max(...data);
    
    // Avoid division by zero
    if (max - min < 1e-6) {
      max = min + 1e-6;
    }

    const imgData = ctx.createImageData(width, height);
    for (let i = 0; i < data.length; i++) {
      const val = data[i];
      // Normalize to 0-1
      const norm = (val - min) / (max - min);
      
      const [r, g, b] = getViridisColor(norm);
      
      const idx = i * 4;
      imgData.data[idx] = r;
      imgData.data[idx + 1] = g;
      imgData.data[idx + 2] = b;
      imgData.data[idx + 3] = 255;
    }

    // Since our target is small (e.g. 28x28 or 14x14), we draw to a temporary canvas of exact size,
    // then scale it up onto the display canvas to preserve crisp pixels
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCanvas.getContext('2d')?.putImageData(imgData, 0, 0);

    // Disable image smoothing for sharp pixels
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
  }, [data, width, height, globalMin, globalMax]);

  return (
    <div 
      className={`relative cursor-pointer transition-all hover:scale-105 overflow-hidden rounded ${selected ? 'ring-2 ring-brand-500 shadow-glow-sm' : 'border border-[var(--border-color)] hover:border-brand-400'}`}
      onClick={onClick}
      style={{ width: canvasSize, height: canvasSize }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize * 2} // Render 2x for retina displays
        height={canvasSize * 2}
        className="w-full h-full block"
      />
    </div>
  );
}
