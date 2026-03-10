import { useState, useRef, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import type { IndicatorConfig } from '../../types';

function formatIndicator(ind: IndicatorConfig): string {
  switch (ind.type) {
    case 'sma':
      return `SMA (${ind.params.period})`;
    case 'ema':
      return `EMA (${ind.params.period})`;
    case 'rsi':
      return `RSI (${ind.params.period})`;
    case 'macd':
      return `MACD (${ind.params.fast}, ${ind.params.slow}, ${ind.params.signal})`;
    case 'bollinger':
      return `BB (${ind.params.period}, ${ind.params.stdDev})`;
  }
}

export function IndicatorsDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedIndicators = useUIStore((s) => s.selectedIndicators);
  const toggleIndicator = useUIStore((s) => s.toggleIndicator);

  const enabledCount = selectedIndicators.filter((i) => i.enabled).length;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative ml-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-surface-tertiary text-slate-400 hover:text-slate-200 transition-colors duration-200 cursor-pointer"
      >
        <BarChart3 className="h-3.5 w-3.5" />
        Indicators
        {enabledCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-accent text-white leading-none">
            {enabledCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-surface-secondary border border-border-primary rounded-xl shadow-xl z-50 py-1">
          <div className="px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
            Indicators
          </div>
          {selectedIndicators.map((ind, index) => (
            <button
              key={index}
              onClick={() => toggleIndicator(index)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-surface-tertiary transition-colors duration-150 cursor-pointer"
            >
              <div
                className={`w-8 h-4 rounded-full transition-colors duration-200 relative ${
                  ind.enabled ? 'bg-accent' : 'bg-surface-tertiary'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${
                    ind.enabled ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </div>
              <span className={ind.enabled ? 'text-slate-200' : 'text-slate-500'}>
                {formatIndicator(ind)}
              </span>
              {ind.color && (
                <span
                  className="ml-auto w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ind.color }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
