import { BarChart3 } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { TIME_RANGES } from '../../lib/constants';

interface ChartToolbarProps {
  symbols: string[];
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
}

export function ChartToolbar({ symbols, selectedSymbol, onSymbolChange }: ChartToolbarProps) {
  const chartTimeRange = useUIStore((s) => s.chartTimeRange);
  const setTimeRange = useUIStore((s) => s.setTimeRange);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <select
        value={selectedSymbol}
        onChange={(e) => onSymbolChange(e.target.value)}
        className="bg-surface-tertiary border border-border-primary text-slate-50 text-sm rounded-lg px-3 py-2 cursor-pointer transition-colors duration-200 hover:border-border-hover focus:outline-none focus:border-accent"
      >
        <option value="">Select ticker…</option>
        {symbols.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1">
        {TIME_RANGES.map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 cursor-pointer ${
              chartTimeRange === range
                ? 'bg-accent text-white'
                : 'bg-surface-tertiary text-slate-400 hover:text-slate-200'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-surface-tertiary text-slate-400 hover:text-slate-200 transition-colors duration-200 cursor-pointer">
        <BarChart3 className="h-3.5 w-3.5" />
        Indicators
      </button>
    </div>
  );
}
