import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { TrainHistoryEpoch } from '../types/nn';

interface TrainingChartsProps {
  history: TrainHistoryEpoch[];
}

export function TrainingCharts({ history }: TrainingChartsProps) {
  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col md:flex-row gap-6 w-full h-64 opacity-50">
        <div className="flex-1 card flex items-center justify-center border-dashed">
          <span className="text-[var(--text-muted)] text-sm">Loss Chart (Awaiting Data)</span>
        </div>
        <div className="flex-1 card flex items-center justify-center border-dashed">
          <span className="text-[var(--text-muted)] text-sm">Accuracy Chart (Awaiting Data)</span>
        </div>
      </div>
    );
  }

  // Format data for recharts
  const data = history.map(h => ({
    epoch: h.epoch,
    loss: Number(h.loss.toFixed(4)),
    val_loss: h.val_loss ? Number(h.val_loss.toFixed(4)) : null,
    accuracy: Number((h.accuracy * 100).toFixed(2)),
    val_accuracy: h.val_accuracy ? Number((h.val_accuracy * 100).toFixed(2)) : null,
  }));

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full h-72">
      <div className="flex-1 card p-4 flex flex-col min-w-0">
        <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider">Loss</h3>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="epoch" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
              <YAxis stroke="var(--text-muted)" fontSize={12} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="loss" name="Train Loss" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="val_loss" name="Val Loss" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex-1 card p-4 flex flex-col min-w-0">
        <h3 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider">Accuracy (%)</h3>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="epoch" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
              <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="accuracy" name="Train Acc" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="val_accuracy" name="Val Acc" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
