import { useState, useMemo } from 'react';
import { Plus, ChevronUp, ChevronDown, ListX, AlertTriangle, RefreshCw } from 'lucide-react';
import { useTickers, useRemoveTicker } from '../hooks/useTickers';
import { TickerRow } from '../components/ticker/TickerRow';
import { AddTickerModal } from '../components/ticker/AddTickerModal';
import { Card } from '../components/common/Card';
import { Skeleton } from '../components/common/Skeleton';

type SortField = 'symbol' | 'last' | 'change' | 'volume' | 'range';
type SortDirection = 'asc' | 'desc';

const COLUMNS: { key: SortField; label: string }[] = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'last', label: 'Last' },
  { key: 'change', label: 'Change' },
  { key: 'volume', label: 'Volume' },
  { key: 'range', label: '52w Range' },
];

export default function Watchlist() {
  const { data: tickers, isLoading, isError, refetch } = useTickers();
  const removeTicker = useRemoveTicker();

  const [modalOpen, setModalOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  const sortedSymbols = useMemo(() => {
    if (!tickers) return [];
    const symbols = tickers.map((t) => t.symbol);
    if (sortField === 'symbol') {
      symbols.sort((a, b) =>
        sortDirection === 'asc' ? a.localeCompare(b) : b.localeCompare(a),
      );
    }
    return symbols;
  }, [tickers, sortField, sortDirection]);

  async function confirmRemove() {
    if (!pendingRemove) return;
    try {
      await removeTicker.mutateAsync(pendingRemove);
    } finally {
      setPendingRemove(null);
    }
  }

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-50">Watchlist</h1>
        </div>
        <div className="bg-surface-secondary border border-border-primary rounded-xl overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-border-primary">
                {COLUMNS.map((col) => (
                  <th key={col.key} className="py-3 px-4 text-left font-medium">
                    {col.label}
                  </th>
                ))}
                <th className="py-3 px-4 w-10" />
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border-primary/50">
                  <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-36" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-4" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-50 mb-6">Watchlist</h1>
        <div className="flex items-center justify-center min-h-[40vh]">
          <Card className="text-center py-12 px-8 max-w-sm">
            <AlertTriangle className="h-12 w-12 text-bearish mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-50 mb-2">Failed to load watchlist</h2>
            <p className="text-sm text-slate-400 mb-4">Something went wrong. Please try again.</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent/80 text-white rounded-lg px-4 py-2 cursor-pointer transition-colors duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </Card>
        </div>
      </div>
    );
  }

  if (!tickers || tickers.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-50 mb-6">Watchlist</h1>
        <div className="flex items-center justify-center min-h-[40vh]">
          <Card className="text-center py-12 px-8 max-w-sm">
            <ListX className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-50 mb-2">Your watchlist is empty</h2>
            <p className="text-sm text-slate-400 mb-4">
              Add tickers to start tracking stocks.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent/80 text-white rounded-lg px-4 py-2 cursor-pointer transition-colors duration-200"
            >
              <Plus className="h-4 w-4" />
              Add Ticker
            </button>
          </Card>
        </div>
        <AddTickerModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-50">Watchlist</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent/80 text-white rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors duration-200"
        >
          <Plus className="h-4 w-4" />
          Add Ticker
        </button>
      </div>

      {pendingRemove && (
        <div className="flex items-center gap-3 mb-4 bg-surface-secondary border border-border-primary rounded-lg px-4 py-3 text-sm">
          <span className="text-slate-300">
            Remove <span className="font-semibold text-slate-50">{pendingRemove}</span>?
          </span>
          <button
            onClick={confirmRemove}
            disabled={removeTicker.isPending}
            className="bg-bearish/20 text-bearish hover:bg-bearish/30 rounded-md px-3 py-1 cursor-pointer transition-colors duration-200 disabled:opacity-50"
          >
            {removeTicker.isPending ? 'Removing...' : 'Confirm'}
          </button>
          <button
            onClick={() => setPendingRemove(null)}
            className="text-slate-400 hover:text-slate-200 cursor-pointer transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="bg-surface-secondary border border-border-primary rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-border-primary">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="py-3 px-4 text-left font-medium cursor-pointer hover:text-slate-300 transition-colors duration-200 select-none"
                  onClick={() => handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortField === col.key &&
                      (sortDirection === 'asc' ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      ))}
                  </span>
                </th>
              ))}
              <th className="py-3 px-4 w-10" />
            </tr>
          </thead>
          <tbody>
            {sortedSymbols.map((symbol) => (
              <TickerRow
                key={symbol}
                symbol={symbol}
                onRemove={setPendingRemove}
              />
            ))}
          </tbody>
        </table>
      </div>

      <AddTickerModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
