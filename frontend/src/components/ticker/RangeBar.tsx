import { formatPrice } from '../../lib/formatters';

interface RangeBarProps {
  low: number;
  high: number;
  current: number;
}

export function RangeBar({ low, high, current }: RangeBarProps) {
  const range = high - low;
  const pct = range > 0 ? Math.min(Math.max(((current - low) / range) * 100, 0), 100) : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 font-mono">{formatPrice(low)}</span>
      <div className="relative bg-surface-tertiary rounded-full h-1.5 w-24">
        <div
          className="absolute bg-accent rounded-full h-1.5"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-accent border-2 border-surface-secondary"
          style={{ left: `${pct}%`, transform: `translate(-50%, -50%)` }}
        />
      </div>
      <span className="text-xs text-slate-500 font-mono">{formatPrice(high)}</span>
    </div>
  );
}
