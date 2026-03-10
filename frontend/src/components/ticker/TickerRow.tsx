import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useSummary } from '../../hooks/useSummary';
import { formatPrice, formatVolume } from '../../lib/formatters';
import { PriceChange } from './PriceChange';
import { RangeBar } from './RangeBar';
import { Skeleton } from '../common/Skeleton';

interface TickerRowProps {
  symbol: string;
  onRemove: (symbol: string) => void;
}

export function TickerRow({ symbol, onRemove }: TickerRowProps) {
  const navigate = useNavigate();
  const { data: summary, isLoading } = useSummary(symbol);

  if (isLoading || !summary) {
    return (
      <tr className="border-b border-border-primary/50">
        <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
        <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
        <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
        <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
        <td className="py-3 px-4"><Skeleton className="h-4 w-36" /></td>
        <td className="py-3 px-4"><Skeleton className="h-4 w-4" /></td>
      </tr>
    );
  }

  const changePercent =
    summary.low_52w > 0
      ? ((summary.latest_close - summary.low_52w) / summary.low_52w) * 100
      : 0;

  return (
    <tr className="border-b border-border-primary/50 hover:bg-surface-tertiary/50 transition-colors duration-200">
      <td className="py-3 px-4">
        <button
          onClick={() => navigate(`/chart/${symbol}`)}
          className="font-semibold text-slate-50 hover:text-accent cursor-pointer transition-colors duration-200 bg-transparent border-none p-0"
        >
          {symbol}
        </button>
      </td>
      <td className="py-3 px-4 font-mono text-slate-50">
        {formatPrice(summary.latest_close)}
      </td>
      <td className="py-3 px-4">
        <PriceChange value={changePercent} />
      </td>
      <td className="py-3 px-4 font-mono text-slate-400">
        {formatVolume(summary.avg_volume_30d)}
      </td>
      <td className="py-3 px-4">
        <RangeBar
          low={summary.low_52w}
          high={summary.high_52w}
          current={summary.latest_close}
        />
      </td>
      <td className="py-3 px-4">
        <button
          onClick={() => onRemove(symbol)}
          className="text-slate-500 hover:text-bearish cursor-pointer transition-colors duration-200 bg-transparent border-none p-0"
          aria-label={`Remove ${symbol}`}
        >
          <X className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}
