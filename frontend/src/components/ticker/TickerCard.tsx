import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../common/Card';
import { Skeleton } from '../common/Skeleton';
import { PriceChange } from './PriceChange';
import { SparklineChart } from './SparklineChart';
import { useSummary } from '../../hooks/useSummary';
import { usePrices } from '../../hooks/usePrices';
import { formatPrice, formatVolume } from '../../lib/formatters';

interface TickerCardProps {
  symbol: string;
}

const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
  .toISOString()
  .split('T')[0];

export function TickerCard({ symbol }: TickerCardProps) {
  const navigate = useNavigate();
  const { data: summary, isLoading: summaryLoading } = useSummary(symbol);
  const { data: prices, isLoading: pricesLoading } = usePrices(symbol, thirtyDaysAgo);

  const sparklineData = useMemo(() => {
    if (!prices?.data) return [];
    return prices.data.map((row) => ({
      time: row.date,
      value: row.close,
    }));
  }, [prices]);

  const changePercent = useMemo(() => {
    if (!sparklineData.length || sparklineData.length < 2) return 0;
    const first = sparklineData[0].value;
    const last = sparklineData[sparklineData.length - 1].value;
    return ((last - first) / first) * 100;
  }, [sparklineData]);

  const isLoading = summaryLoading || pricesLoading;

  if (isLoading) {
    return (
      <Card>
        <Skeleton className="h-5 w-16 mb-3" />
        <Skeleton className="h-7 w-24 mb-2" />
        <Skeleton className="h-4 w-20 mb-3" />
        <Skeleton className="h-[60px] w-full mb-3" />
        <Skeleton className="h-4 w-28 mb-1" />
        <Skeleton className="h-4 w-32" />
      </Card>
    );
  }

  if (!summary) return null;

  return (
    <Card onClick={() => navigate(`/chart/${symbol}`)}>
      <p className="text-sm font-semibold text-slate-100 mb-1">{symbol}</p>
      <p className="text-xl font-mono text-slate-50 mb-1">
        ${formatPrice(summary.latest_close)}
      </p>
      <PriceChange value={changePercent} className="text-sm mb-2" />
      <div className="my-2">
        <SparklineChart data={sparklineData} />
      </div>
      <div className="flex justify-between text-xs text-slate-400 mt-2">
        <span>Vol: {formatVolume(summary.avg_volume_30d)}</span>
        <span>
          52w: {formatPrice(summary.low_52w)} - {formatPrice(summary.high_52w)}
        </span>
      </div>
    </Card>
  );
}
