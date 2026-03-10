export const CHART_COLORS = {
  bullish: '#22C55E',
  bullishWick: '#16A34A',
  bearish: '#EF4444',
  bearishWick: '#DC2626',
  volume: 'rgba(59, 130, 246, 0.4)',
  background: '#020617',
  grid: '#1E293B',
  crosshair: 'rgba(148, 163, 184, 0.5)',
  sma: ['#3B82F6', '#F59E0B', '#8B5CF6'],
  ema: ['#06B6D4', '#F97316'],
} as const;

export const TIME_RANGES = ['1M', '3M', '6M', '1Y', '5Y', 'ALL'] as const;

export function getStartDateForRange(range: string): string | undefined {
  const now = new Date();
  const map: Record<string, number> = {
    '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '5Y': 1825,
  };
  const days = map[range];
  if (!days) return undefined;
  const start = new Date(now.getTime() - days * 86400000);
  return start.toISOString().split('T')[0];
}
