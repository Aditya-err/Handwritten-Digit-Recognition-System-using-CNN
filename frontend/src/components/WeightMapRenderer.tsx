import { useEffect, useRef, useState } from 'react';

// Diverging colormap for gradients (negative: red, zero: white, positive: blue)
function getDivergingColor(v: number, maxAbs: number): [number, number, number] {
  if (maxAbs === 0) return [255, 255, 255]; // Avoid division by zero
  
  // Normalize between -1 and 1
  const norm = Math.max(-1, Math.min(1, v / maxAbs));
  
  if (norm < 0) {
    // Negative -> Red
    const intensity = Math.abs(norm);
    return [
      255, 
      Math.round(255 * (1 - intensity)), 
      Math.round(255 * (1 - intensity))
    ];
  } else {
    // Positive -> Blue
    const intensity = norm;
    return [
      Math.round(255 * (1 - intensity)), 
      Math.round(255 * (1 - intensity)), 
      255
    ];
  }
}

interface WeightMapRendererProps {
  weights: number[][];   // shape [rows][cols]
  gradients?: number[][]; // shape [rows][cols]
  maxAbsValue?: number;
  canvasHeight?: number;
  onNeuronSelect?: (rowIndex: number) => void;
  onWeightSelect?: (rowIndex: number, colIndex: number) => void;
  selectedRow?: number | null;
}

export function WeightMapRenderer({
  weights,
  gradients,
  maxAbsValue,
  canvasHeight = 400,
  onNeuronSelect,
  onWeightSelect,
  selectedRow
}: WeightMapRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverInfo, setHoverInfo] = useState<{row: number, col: number, x: number, y: number} | null>(null);

  const rows = weights.length;
  const cols = rows > 0 ? weights[0].length : 0;
  
  // The data to display (gradients preferred for backprop, fallback to weights)
  const displayData = gradients || weights;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || rows === 0 || cols === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate max absolute value if not provided
    let maxAbs = maxAbsValue;
    if (maxAbs === undefined) {
      maxAbs = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          maxAbs = Math.max(maxAbs, Math.abs(displayData[r][c]));
        }
      }
    }
    
    // Create image data for the precise dimensions (rows x cols)
    const imgData = ctx.createImageData(cols, rows);
    let idx = 0;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = displayData[r][c];
        const [r_c, g_c, b_c] = getDivergingColor(val, maxAbs);
        
        imgData.data[idx] = r_c;
        imgData.data[idx + 1] = g_c;
        imgData.data[idx + 2] = b_c;
        imgData.data[idx + 3] = 255; // Alpha
        
        // Highlight selected row with a slight tint
        if (selectedRow === r) {
           imgData.data[idx + 1] = Math.max(0, imgData.data[idx+1] - 50); // slight magenta tint
        }
        
        idx += 4;
      }
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cols;
    tempCanvas.height = rows;
    tempCanvas.getContext('2d')?.putImageData(imgData, 0, 0);

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
    
    // Draw row selection overlay line
    if (selectedRow !== null && selectedRow !== undefined) {
      const rowHeight = canvas.height / rows;
      const y = selectedRow * rowHeight;
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = Math.max(1, rowHeight);
      ctx.strokeRect(0, y, canvas.width, rowHeight);
    }

  }, [displayData, rows, cols, maxAbsValue, selectedRow]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (rows === 0 || cols === 0) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.floor((x / rect.width) * cols);
    const row = Math.floor((y / rect.height) * rows);
    
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      setHoverInfo({ row, col, x: e.clientX, y: e.clientY });
    } else {
      setHoverInfo(null);
    }
  };

  const handleMouseLeave = () => setHoverInfo(null);

  const handleClick = () => {
    if (hoverInfo) {
      if (onNeuronSelect) onNeuronSelect(hoverInfo.row);
      if (onWeightSelect) onWeightSelect(hoverInfo.row, hoverInfo.col);
    }
  };

  return (
    <div className="relative border border-[var(--border-color)] rounded overflow-hidden shadow-inner bg-white dark:bg-zinc-900 w-full" style={{ maxWidth: '100%' }}>
      <canvas
        ref={canvasRef}
        width={cols} 
        height={rows}
        style={{ width: '100%', height: canvasHeight, imageRendering: 'pixelated', display: 'block', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
      
      {/* Tooltip */}
      {hoverInfo && (
        <div 
          className="fixed z-50 pointer-events-none bg-black/80 text-white text-xs px-2 py-1.5 rounded shadow-lg backdrop-blur-sm whitespace-nowrap"
          style={{ left: hoverInfo.x + 10, top: hoverInfo.y + 10 }}
        >
          <div className="font-bold text-gray-300 border-b border-gray-600 pb-1 mb-1">
            Neuron {hoverInfo.row} | Input {hoverInfo.col}
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <span className="text-gray-400">Weight:</span>
            <span className="font-mono text-right">{weights[hoverInfo.row][hoverInfo.col].toFixed(4)}</span>
            
            {gradients && (
              <>
                <span className="text-gray-400">Gradient:</span>
                <span className={`font-mono text-right ${gradients[hoverInfo.row][hoverInfo.col] < 0 ? 'text-red-400' : gradients[hoverInfo.row][hoverInfo.col] > 0 ? 'text-blue-400' : 'text-gray-300'}`}>
                  {gradients[hoverInfo.row][hoverInfo.col].toFixed(6)}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
