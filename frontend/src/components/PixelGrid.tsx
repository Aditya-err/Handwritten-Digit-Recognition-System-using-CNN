import React, { useRef, useEffect, useState } from 'react';

interface PixelGridProps {
  flatArray: number[];
  width: number;
  height: number;
  scale?: number;
}

export function PixelGrid({ flatArray, width, height, scale = 12 }: PixelGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPixel, setHoveredPixel] = useState<{ row: number; col: number; val: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || flatArray.length !== width * height) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw the entire grid
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const val = flatArray[r * width + c];
        
        // Value is 0.0 - 1.0. Background is black, ink is white?
        // Wait, MNIST: 0 is black, 1 is white.
        const intensity = Math.floor(val * 255);
        ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
        ctx.fillRect(c * scale, r * scale, scale, scale);
      }
    }
  }, [flatArray, width, height, scale]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor(x / scale);
    const row = Math.floor(y / scale);

    if (row >= 0 && row < height && col >= 0 && col < width) {
      const val = flatArray[row * width + col];
      setHoveredPixel({ row, col, val });
    } else {
      setHoveredPixel(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPixel(null);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative inline-block border border-brand-500/20 bg-black">
        <canvas
          ref={canvasRef}
          width={width * scale}
          height={height * scale}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: 'crosshair', imageRendering: 'pixelated' }}
        />
        
        {hoveredPixel && (
          <div 
            className="absolute pointer-events-none border border-brand-400 bg-brand-500/30"
            style={{
              left: hoveredPixel.col * scale,
              top: hoveredPixel.row * scale,
              width: scale,
              height: scale,
            }}
          />
        )}
      </div>

      <div className="mt-4 h-12 text-sm text-center font-mono">
        {hoveredPixel ? (
          <div>
            <span className="text-[var(--text-muted)]">Row: </span>
            <span className="font-bold">{hoveredPixel.row.toString().padStart(2, ' ')}</span>
            <span className="text-[var(--text-muted)] ml-4">Col: </span>
            <span className="font-bold">{hoveredPixel.col.toString().padStart(2, ' ')}</span>
            <span className="text-[var(--text-muted)] ml-4">Value: </span>
            <span className="font-bold">{hoveredPixel.val.toFixed(3)}</span>
          </div>
        ) : (
          <div className="text-[var(--text-muted)] italic">
            Hover over the grid to inspect pixel values
          </div>
        )}
      </div>
    </div>
  );
}
