import { useState, useEffect } from 'react';
import { BarChart2, Play, Square, Settings2, Activity, Info, AlertTriangle } from 'lucide-react';
import { TrainingCharts } from '../components/TrainingCharts';
import type { TrainStatusResponse } from '../types/nn';

export function TrainingPage() {
  // Form state
  const [epochs, setEpochs] = useState(5);
  const [batchSize, setBatchSize] = useState(128);
  const [learningRate, setLearningRate] = useState(0.1);
  const [subsetSize, setSubsetSize] = useState<number | ''>(1000); // Allow empty for 'full'
  const [valSplit, setValSplit] = useState(0.1);
  const [seed, setSeed] = useState(42);

  // Status state
  const [status, setStatus] = useState<TrainStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Polling effect
  useEffect(() => {
    let interval: number | undefined;

    const fetchStatus = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/v1/model/status');
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch (e) {
        console.error("Failed to fetch status", e);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll if training
    if (status?.status === 'training') {
      interval = window.setInterval(fetchStatus, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status?.status]);

  const handleStart = async () => {
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/api/v1/model/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          epochs,
          batch_size: batchSize,
          learning_rate: learningRate,
          subset_size: subsetSize === '' ? null : subsetSize,
          validation_split: valSplit,
          seed
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to start training');
      }

      // Manually update status so polling kicks in immediately
      setStatus(prev => prev ? { ...prev, status: 'training' } : null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleStop = async () => {
    try {
      await fetch('http://localhost:8000/api/v1/model/stop', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  const isTraining = status?.status === 'training';
  const progressPercent = status && status.total_epochs > 0 
    ? Math.min(100, Math.max(0, (((status.epoch - 1) + (status.batch / Math.max(1, status.total_batches))) / status.total_epochs) * 100))
    : 0;

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto h-full pb-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20">
            <BarChart2 size={24} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Training Dashboard</h1>
            <p className="text-sm text-[var(--text-secondary)]">Monitor real-time training metrics from the NumPy neural network.</p>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className={`px-4 py-1.5 rounded-full text-sm font-medium border flex items-center gap-2 ${
          status?.status === 'training' ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' :
          status?.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' :
          status?.status === 'failed' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
          'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)]'
        }`}>
          {status?.status === 'training' && <Activity size={16} className="animate-pulse" />}
          {status?.status ? status.status.charAt(0).toUpperCase() + status.status.slice(1) : 'Idle'}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Config */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--border-color)]">
              <Settings2 size={18} className="text-[var(--text-muted)]" />
              <h2 className="font-semibold text-base">Configuration</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Epochs</label>
                <input type="number" min="1" max="100" className="input-field w-full" value={epochs} onChange={e => setEpochs(Number(e.target.value))} disabled={isTraining} />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Batch Size</label>
                <input type="number" min="1" max="1024" className="input-field w-full" value={batchSize} onChange={e => setBatchSize(Number(e.target.value))} disabled={isTraining} />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Learning Rate</label>
                <input type="number" step="0.01" min="0.0001" className="input-field w-full" value={learningRate} onChange={e => setLearningRate(Number(e.target.value))} disabled={isTraining} />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Subset Size (empty for all 60k)</label>
                <input type="number" min="100" max="60000" className="input-field w-full" value={subsetSize} onChange={e => setSubsetSize(e.target.value === '' ? '' : Number(e.target.value))} disabled={isTraining} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">Val Split</label>
                  <input type="number" step="0.05" min="0" max="0.5" className="input-field w-full" value={valSplit} onChange={e => setValSplit(Number(e.target.value))} disabled={isTraining} />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">Seed</label>
                  <input type="number" className="input-field w-full" value={seed} onChange={e => setSeed(Number(e.target.value))} disabled={isTraining} />
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              {!isTraining ? (
                <button onClick={handleStart} className="btn-primary flex-1 flex justify-center items-center gap-2 py-2.5">
                  <Play size={18} /> Start Training
                </button>
              ) : (
                <button onClick={handleStop} className="bg-red-500 hover:bg-red-600 text-white rounded-lg flex-1 flex justify-center items-center gap-2 py-2.5 font-medium transition-colors">
                  <Square size={18} /> Stop
                </button>
              )}
            </div>
            
            <p className="text-xs text-[var(--text-muted)] mt-4">
              <Info size={12} className="inline mr-1 relative -top-0.5" />
              Pretrained prediction weights (model.npz) are kept completely safe. Custom trained weights are saved to custom_model.npz.
            </p>
          </div>

          <div className="card p-5 bg-blue-500/5 border-blue-500/20">
            <h3 className="font-semibold text-sm text-blue-400 mb-2 flex items-center gap-2">
              <Info size={16} /> Educational Concepts
            </h3>
            <ul className="text-sm space-y-3 text-[var(--text-secondary)]">
              <li><strong className="text-[var(--text-primary)]">Epoch:</strong> One complete pass through the entire training dataset.</li>
              <li><strong className="text-[var(--text-primary)]">Batch Size:</strong> The number of samples processed before the model updates its weights.</li>
              <li><strong className="text-[var(--text-primary)]">Learning Rate:</strong> Step size used during weight updates. Too large causes divergence; too small slows learning.</li>
              <li><strong className="text-[var(--text-primary)]">Validation Split:</strong> A portion of data withheld from training to test if the model is overfitting.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Monitors */}
        <div className="xl:col-span-2 flex flex-col gap-6 min-w-0">
          
          {/* Progress */}
          <div className="card p-5">
             <div className="flex justify-between items-end mb-2">
               <h3 className="font-medium">Overall Progress</h3>
               <span className="text-sm text-[var(--text-muted)]">
                 Epoch {status?.epoch || 0} / {status?.total_epochs || 0}
               </span>
             </div>
             <div className="w-full h-3 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
               <div 
                 className="h-full bg-blue-500 transition-all duration-300 ease-out" 
                 style={{ width: `${progressPercent}%` }}
               />
             </div>
             <div className="flex justify-between text-xs text-[var(--text-muted)] mt-2">
               <span>Batch {status?.batch || 0} of {status?.total_batches || 0}</span>
               <span>{progressPercent.toFixed(1)}%</span>
             </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 flex flex-col justify-center items-center text-center">
              <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">Train Loss</span>
              <span className="text-2xl font-bold text-blue-500">
                {status?.loss ? status.loss.toFixed(4) : '0.0000'}
              </span>
            </div>
            <div className="card p-4 flex flex-col justify-center items-center text-center">
              <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">Train Acc</span>
              <span className="text-2xl font-bold text-emerald-500">
                {status?.accuracy ? (status.accuracy * 100).toFixed(1) + '%' : '0.0%'}
              </span>
            </div>
            <div className="card p-4 flex flex-col justify-center items-center text-center">
              <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">Val Loss</span>
              <span className="text-2xl font-bold text-amber-500">
                {status?.val_loss ? status.val_loss.toFixed(4) : '--'}
              </span>
            </div>
            <div className="card p-4 flex flex-col justify-center items-center text-center">
              <span className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">Val Acc</span>
              <span className="text-2xl font-bold text-purple-500">
                {status?.val_accuracy ? (status.val_accuracy * 100).toFixed(1) + '%' : '--'}
              </span>
            </div>
          </div>

          {/* Charts */}
          <TrainingCharts history={status?.history || []} />

        </div>
      </div>
    </div>
  );
}
