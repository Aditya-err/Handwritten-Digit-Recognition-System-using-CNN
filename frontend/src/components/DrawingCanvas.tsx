import { useRef, useEffect, useState } from 'react';
import { Eraser, Send } from 'lucide-react';

interface DrawingCanvasProps {
  onPredict: (b64Image: string) => void;
  onClear?: () => void;
  disabled?: boolean;
}

export function DrawingCanvas({ onPredict, onClear, disabled }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Fill with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 15; // Thick brush for MNIST-like digits
    ctx.strokeStyle = '#000000'; // Black strokes
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    setIsDrawing(true);
    setHasContent(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.beginPath(); // Reset path so next stroke doesn't connect
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get coordinates
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    setHasContent(false);
    if (onClear) onClear();
  };

  const submit = () => {
    if (!hasContent || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Export base64
    const b64 = canvas.toDataURL('image/png');
    onPredict(b64);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div 
        className={`relative overflow-hidden rounded-lg border-2 border-[var(--border-color)] bg-white ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-crosshair'}`}
        style={{ width: 280, height: 280, touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          className="block"
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
        />
      </div>
      <div className="flex w-full max-w-[280px] gap-2">
        <button 
          onClick={clear} 
          disabled={!hasContent || disabled}
          className="flex-1 btn-secondary flex items-center justify-center gap-2 py-2"
        >
          <Eraser size={16} /> Clear
        </button>
        <button 
          onClick={submit} 
          disabled={!hasContent || disabled}
          className="flex-1 btn-primary flex items-center justify-center gap-2 py-2"
        >
          <Send size={16} /> Predict
        </button>
      </div>
    </div>
  );
}
