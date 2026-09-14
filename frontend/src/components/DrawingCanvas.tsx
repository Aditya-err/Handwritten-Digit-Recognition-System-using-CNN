import { useRef, useEffect, useState, useCallback } from 'react';
import { Eraser, Send } from 'lucide-react';

interface DrawingCanvasProps {
  onPredict: (b64Image: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  autoPredict?: boolean;
}

export function DrawingCanvas({ onPredict, onClear, disabled, autoPredict = false }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const autoPredictTimeoutRef = useRef<number | null>(null);

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
    ctx.lineWidth = 18; // Thick brush for MNIST-like digits
    ctx.strokeStyle = '#000000'; // Black strokes
  }, []);

  const clearAutoPredict = () => {
    if (autoPredictTimeoutRef.current !== null) {
      window.clearTimeout(autoPredictTimeoutRef.current);
      autoPredictTimeoutRef.current = null;
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    clearAutoPredict();
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
    
    if (autoPredict && hasContent && !disabled) {
      clearAutoPredict();
      autoPredictTimeoutRef.current = window.setTimeout(() => {
        submit();
      }, 500); // 500ms debounce
    }
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

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    clearAutoPredict();
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

  const submit = useCallback(() => {
    clearAutoPredict();
    if (!hasContent || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Export base64
    const b64 = canvas.toDataURL('image/png');
    onPredict(b64);
  }, [hasContent, disabled, onPredict]);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div 
        className={`relative overflow-hidden rounded-lg border-2 border-[var(--border-color)] bg-white ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-crosshair'} w-full max-w-[320px] aspect-square`}
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          aria-label="Drawing canvas for digit recognition"
          role="img"
          className="block w-full h-full"
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
          aria-label="Clear canvas"
          className="flex-1 btn-secondary flex items-center justify-center gap-2 py-2"
        >
          <Eraser size={16} /> Clear
        </button>
        {!autoPredict && (
          <button 
            onClick={submit} 
            disabled={!hasContent || disabled}
            aria-label="Predict digit"
            className="flex-1 btn-primary flex items-center justify-center gap-2 py-2"
          >
            <Send size={16} /> Predict
          </button>
        )}
      </div>
      {autoPredict && (
        <div className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1 opacity-70">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Auto-predicting as you draw
        </div>
      )}
    </div>
  );
}
