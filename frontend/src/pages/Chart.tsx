import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CandlestickChart } from '../components/chart/CandlestickChart';
import { ChartToolbar } from '../components/chart/ChartToolbar';
import { SymbolHeader } from '../components/chart/SymbolHeader';
import { IndicatorPanel } from '../components/chart/IndicatorPanel';
import { Skeleton } from '../components/common/Skeleton';
import { Card } from '../components/common/Card';
import { usePrices } from '../hooks/usePrices';
import { useTickers } from '../hooks/useTickers';
import { useUIStore } from '../stores/uiStore';
import { getStartDateForRange } from '../lib/constants';
import {
  computeSMA,
  computeEMA,
  computeRSI,
  computeMACD,
  computeBollingerBands,
} from '../lib/indicators';
import { BarChart3, AlertCircle, RefreshCw } from 'lucide-react';

export default function Chart() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const chartTimeRange = useUIStore((s) => s.chartTimeRange);
  const selectedIndicators = useUIStore((s) => s.selectedIndicators);
  const startDate = getStartDateForRange(chartTimeRange);

  const { data: tickers } = useTickers();
  const symbols = tickers?.map((t) => t.symbol) ?? [];

  const {
    data: priceData,
    isLoading,
    error,
    refetch,
  } = usePrices(symbol ?? '', startDate);

  const closes = useMemo(() => priceData?.data.map((r) => r.close) ?? [], [priceData]);
  const dates = useMemo(() => priceData?.data.map((r) => r.date) ?? [], [priceData]);

  const overlays = useMemo(() => {
    if (closes.length === 0) return [];

    const result: { data: { time: string; value: number }[]; color: string }[] = [];

    for (const ind of selectedIndicators) {
      if (!ind.enabled) continue;
      if (ind.type === 'sma') {
        result.push({ data: computeSMA(closes, dates, ind.params.period), color: ind.color! });
      } else if (ind.type === 'ema') {
        result.push({ data: computeEMA(closes, dates, ind.params.period), color: ind.color! });
      } else if (ind.type === 'bollinger') {
        const bb = computeBollingerBands(closes, dates, ind.params.period, ind.params.stdDev);
        result.push({ data: bb.map((b) => ({ time: b.time, value: b.upper })), color: ind.color! });
        result.push({ data: bb.map((b) => ({ time: b.time, value: b.middle })), color: ind.color! });
        result.push({ data: bb.map((b) => ({ time: b.time, value: b.lower })), color: ind.color! });
      }
    }
    return result;
  }, [closes, dates, selectedIndicators]);

  const rsiConfig = selectedIndicators.find((i) => i.type === 'rsi' && i.enabled);
  const rsiData = useMemo(
    () => (rsiConfig && closes.length > 0 ? computeRSI(closes, dates, rsiConfig.params.period) : null),
    [rsiConfig, closes, dates],
  );

  const macdConfig = selectedIndicators.find((i) => i.type === 'macd' && i.enabled);
  const macdData = useMemo(
    () =>
      macdConfig && closes.length > 0
        ? computeMACD(closes, dates, macdConfig.params.fast, macdConfig.params.slow, macdConfig.params.signal)
        : null,
    [macdConfig, closes, dates],
  );

  const handleSymbolChange = (s: string) => {
    if (s) navigate(`/chart/${s}`);
    else navigate('/chart');
  };

  return (
    <div className="space-y-4">
      <ChartToolbar
        symbols={symbols}
        selectedSymbol={symbol ?? ''}
        onSymbolChange={handleSymbolChange}
      />

      {!symbol && (
        <Card className="text-center py-16">
          <BarChart3 className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-300 mb-1">Select a ticker to begin charting</p>
          <p className="text-sm text-slate-500">
            Choose a symbol from the dropdown above
          </p>
        </Card>
      )}

      {symbol && isLoading && (
        <div className="space-y-4">
          <div className="space-y-3">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-[500px] w-full rounded-xl" />
        </div>
      )}

      {symbol && error && (
        <Card className="text-center py-12">
          <AlertCircle className="h-10 w-10 text-bearish mx-auto mb-3" />
          <p className="text-slate-300 mb-1">Failed to load price data</p>
          <p className="text-sm text-slate-500 mb-4">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-blue-600 transition-colors duration-200 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </Card>
      )}

      {symbol && !isLoading && !error && priceData && (
        <div className="space-y-4">
          <SymbolHeader symbol={symbol} />
          <CandlestickChart data={priceData.data} overlays={overlays} />
          {rsiData && <IndicatorPanel type="rsi" data={rsiData} />}
          {macdData && <IndicatorPanel type="macd" data={macdData} />}
        </div>
      )}
    </div>
  );
}
