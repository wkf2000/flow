import { useSummary } from '../../hooks/useSummary';
import { PriceChange } from '../ticker/PriceChange';
import { Skeleton } from '../common/Skeleton';
import { formatPrice } from '../../lib/formatters';

interface SymbolHeaderProps {
  symbol: string;
}

export function SymbolHeader({ symbol }: SymbolHeaderProps) {
  const { data: summary, isLoading } = useSummary(symbol);

  if (isLoading || !summary) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }

  const { latest_close, high_52w, low_52w } = summary;
  const range52w = high_52w - low_52w;
  const positionPct = range52w > 0 ? ((latest_close - low_52w) / range52w) * 100 : 50;
  const changePct = low_52w > 0 ? ((latest_close - low_52w) / low_52w) * 100 : 0;

  return (
    <div className="space-y-1">
      <h2 className="text-2xl font-semibold text-slate-50">{symbol}</h2>

      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-mono font-bold text-slate-50">
          ${formatPrice(latest_close)}
        </span>
        <PriceChange value={changePct} />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <span className="text-xs text-slate-500 font-mono">{formatPrice(low_52w)}</span>
        <div className="relative w-48 h-1.5 bg-surface-tertiary rounded-full">
          <div
            className="absolute inset-y-0 left-0 bg-accent rounded-full"
            style={{ width: `${Math.min(Math.max(positionPct, 0), 100)}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-accent border-2 border-surface-primary"
            style={{ left: `${Math.min(Math.max(positionPct, 0), 100)}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>
        <span className="text-xs text-slate-500 font-mono">{formatPrice(high_52w)}</span>
        <span className="text-xs text-slate-600 ml-1">52w</span>
      </div>
    </div>
  );
}
