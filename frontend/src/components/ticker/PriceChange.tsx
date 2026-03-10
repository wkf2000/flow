import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceChangeProps {
  value: number;
  className?: string;
}

export function PriceChange({ value, className = '' }: PriceChangeProps) {
  let colorClass: string;
  let Icon: typeof TrendingUp;

  if (value > 0) {
    colorClass = 'text-bullish';
    Icon = TrendingUp;
  } else if (value < 0) {
    colorClass = 'text-bearish';
    Icon = TrendingDown;
  } else {
    colorClass = 'text-slate-400';
    Icon = Minus;
  }

  return (
    <span className={`inline-flex items-center gap-1 font-mono ${colorClass} ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {value > 0 ? '+' : ''}{value.toFixed(2)}%
    </span>
  );
}
