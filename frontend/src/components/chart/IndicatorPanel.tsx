import { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  LineSeries,
  HistogramSeries,
  type IChartApi,
} from 'lightweight-charts';
import { CHART_COLORS } from '../../lib/constants';

interface RSIDataPoint {
  time: string;
  value: number;
}

interface MACDDataPoint {
  time: string;
  macd: number;
  signal: number;
  histogram: number;
}

interface IndicatorPanelProps {
  type: 'rsi' | 'macd';
  data: RSIDataPoint[] | MACDDataPoint[];
}

export function IndicatorPanel({ type, data }: IndicatorPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 150,
      layout: {
        background: { type: ColorType.Solid, color: CHART_COLORS.background },
        textColor: '#94A3B8',
      },
      grid: {
        vertLines: { color: CHART_COLORS.grid },
        horzLines: { color: CHART_COLORS.grid },
      },
      rightPriceScale: { borderColor: CHART_COLORS.grid },
      timeScale: { borderColor: CHART_COLORS.grid, timeVisible: false },
      crosshair: {
        vertLine: { color: CHART_COLORS.crosshair },
        horzLine: { color: CHART_COLORS.crosshair },
      },
    });
    chartRef.current = chart;

    if (type === 'rsi') {
      const rsiData = data as RSIDataPoint[];
      chart.priceScale('right').applyOptions({
        autoScale: false,
        scaleMargins: { top: 0.05, bottom: 0.05 },
      });

      const rsiSeries = chart.addSeries(LineSeries, {
        color: '#3B82F6',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      rsiSeries.setData(rsiData);

      rsiSeries.createPriceLine({
        price: 70,
        color: '#EF4444',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
      });
      rsiSeries.createPriceLine({
        price: 30,
        color: '#22C55E',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
      });
    } else {
      const macdData = data as MACDDataPoint[];

      const histSeries = chart.addSeries(HistogramSeries, {
        priceLineVisible: false,
        lastValueVisible: false,
      });
      histSeries.setData(
        macdData.map((d) => ({
          time: d.time,
          value: d.histogram,
          color: d.histogram >= 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)',
        })),
      );

      const macdLineSeries = chart.addSeries(LineSeries, {
        color: '#3B82F6',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      macdLineSeries.setData(
        macdData.map((d) => ({ time: d.time, value: d.macd })),
      );

      const signalSeries = chart.addSeries(LineSeries, {
        color: '#F59E0B',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      signalSeries.setData(
        macdData.map((d) => ({ time: d.time, value: d.signal })),
      );
    }

    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      chart.applyOptions({ width });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [type, data]);

  const label = type === 'rsi' ? 'RSI' : 'MACD';

  return (
    <div className="relative">
      <div className="absolute top-2 left-3 z-10 text-xs font-medium text-slate-500">
        {label}
      </div>
      <div ref={containerRef} className="w-full h-[150px]" />
    </div>
  );
}
