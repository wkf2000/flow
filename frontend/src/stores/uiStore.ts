import { create } from 'zustand';
import type { IndicatorConfig } from '../types';

const DEFAULT_INDICATORS: IndicatorConfig[] = [
  { type: 'sma', params: { period: 20 }, enabled: false, color: '#3B82F6' },
  { type: 'sma', params: { period: 50 }, enabled: false, color: '#F59E0B' },
  { type: 'sma', params: { period: 200 }, enabled: false, color: '#8B5CF6' },
  { type: 'ema', params: { period: 12 }, enabled: false, color: '#06B6D4' },
  { type: 'ema', params: { period: 26 }, enabled: false, color: '#F97316' },
  { type: 'rsi', params: { period: 14 }, enabled: false },
  { type: 'macd', params: { fast: 12, slow: 26, signal: 9 }, enabled: false },
  { type: 'bollinger', params: { period: 20, stdDev: 2 }, enabled: false, color: '#6B7280' },
];

interface UIState {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  selectedIndicators: IndicatorConfig[];
  chartTimeRange: '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL';
  toggleSidebar: () => void;
  setSidebarMobileOpen: (open: boolean) => void;
  toggleIndicator: (index: number) => void;
  updateIndicatorParams: (index: number, params: Record<string, number>) => void;
  setTimeRange: (range: UIState['chartTimeRange']) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  selectedIndicators: DEFAULT_INDICATORS,
  chartTimeRange: '1Y',
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),
  toggleIndicator: (index) =>
    set((s) => {
      const indicators = [...s.selectedIndicators];
      indicators[index] = { ...indicators[index], enabled: !indicators[index].enabled };
      return { selectedIndicators: indicators };
    }),
  updateIndicatorParams: (index, params) =>
    set((s) => {
      const indicators = [...s.selectedIndicators];
      indicators[index] = { ...indicators[index], params };
      return { selectedIndicators: indicators };
    }),
  setTimeRange: (range) => set({ chartTimeRange: range }),
}));
