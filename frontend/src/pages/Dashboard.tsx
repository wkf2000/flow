import { useState } from 'react';
import { Plus, AlertCircle, BarChart3 } from 'lucide-react';
import { useTickers } from '../hooks/useTickers';
import { TickerCard } from '../components/ticker/TickerCard';
import { AddTickerModal } from '../components/ticker/AddTickerModal';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';

export default function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data: tickers, isLoading, error, refetch } = useTickers();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-50">Market Overview</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Ticker
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-5 w-16 mb-3" />
              <Skeleton className="h-7 w-24 mb-2" />
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-[60px] w-full mb-3" />
              <Skeleton className="h-4 w-28 mb-1" />
              <Skeleton className="h-4 w-32" />
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Card className="max-w-md mx-auto text-center py-8">
          <AlertCircle className="h-10 w-10 text-bearish mx-auto mb-3" />
          <p className="text-slate-300 mb-4">Failed to load tickers</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </Card>
      )}

      {!isLoading && !error && tickers?.length === 0 && (
        <Card className="max-w-md mx-auto text-center py-12">
          <BarChart3 className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-300 mb-1">No tickers yet</p>
          <p className="text-slate-500 text-sm mb-6">
            Add your first ticker to get started.
          </p>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Ticker
          </Button>
        </Card>
      )}

      {!isLoading && !error && tickers && tickers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tickers.map((t) => (
            <TickerCard key={t.symbol} symbol={t.symbol} />
          ))}
        </div>
      )}

      <AddTickerModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
