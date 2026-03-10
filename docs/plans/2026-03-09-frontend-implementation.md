# Flow Frontend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a professional stock market charting webapp frontend that consumes the existing Flow FastAPI backend.

**Architecture:** React SPA with TanStack Query for server state management, Zustand for UI state, Lightweight Charts for candlestick rendering, and client-side indicator computation. Dark-first polished design using Tailwind CSS custom theme tokens.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS v4, TanStack React Query v5, Zustand, Lightweight Charts, technicalindicators, Lucide React, Axios, React Router v7

**Design doc:** `docs/plans/2026-03-09-frontend-design.md`

---

### Task 1: Scaffold Vite + React + TypeScript Project

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.app.json`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/vite-env.d.ts`

**Step 1: Create Vite project**

```bash
cd /Users/michael/repo/flow
npm create vite@latest frontend -- --template react-ts
```

**Step 2: Install core dependencies**

```bash
cd frontend
npm install @tanstack/react-query axios zustand react-router-dom lightweight-charts lucide-react technicalindicators
npm install -D tailwindcss @tailwindcss/vite @types/node
```

**Step 3: Verify it runs**

```bash
npm run dev
```

Expected: Vite dev server starts on `http://localhost:5173`, default React page renders.

**Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold Vite + React + TypeScript frontend with dependencies"
```

---

### Task 2: Configure Tailwind CSS + Design System

**Files:**
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/src/main.tsx` (or create `frontend/src/index.css`)
- Create: `frontend/src/index.css`

**Step 1: Add Tailwind Vite plugin**

In `frontend/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    },
  },
})
```

**Step 2: Create CSS with Tailwind + custom theme**

In `frontend/src/index.css`:
```css
@import "tailwindcss";

@theme {
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'Fira Code', monospace;

  --color-surface-primary: #020617;
  --color-surface-secondary: #0F172A;
  --color-surface-tertiary: #1E293B;
  --color-border-primary: #334155;
  --color-border-hover: #475569;
  --color-accent: #3B82F6;
  --color-bullish: #22C55E;
  --color-bearish: #EF4444;
}
```

**Step 3: Import CSS and Google Fonts in index.html**

In `frontend/index.html`, add to `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

In `frontend/src/main.tsx`, ensure `import './index.css'` is present.

**Step 4: Verify Tailwind works**

In `App.tsx`, add `<div className="bg-surface-primary text-slate-50 min-h-screen p-8">Tailwind works</div>`. Run `npm run dev`, verify dark background with white text.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: configure Tailwind CSS v4 with dark fintech design tokens"
```

---

### Task 3: TypeScript Types

**Files:**
- Create: `frontend/src/types/index.ts`

**Step 1: Define types matching backend Pydantic models**

```typescript
export interface OHLCVRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap: number;
  split_ratio: number;
  dividend: number;
}

export interface TickerInfo {
  added: string;
  last_ingested: string | null;
}

export interface TickerResponse {
  symbol: string;
  info: TickerInfo;
}

export interface PriceResponse {
  symbol: string;
  count: number;
  data: OHLCVRow[];
}

export interface SummaryResponse {
  symbol: string;
  latest_date: string;
  latest_close: number;
  high_52w: number;
  low_52w: number;
  avg_volume_30d: number;
  total_rows: number;
}

export interface IngestResult {
  symbol: string;
  rows_fetched: number;
  rows_written: number;
  status: string;
}

export interface IngestResponse {
  results: IngestResult[];
}

export interface IndicatorConfig {
  type: 'sma' | 'ema' | 'rsi' | 'macd' | 'bollinger';
  params: Record<string, number>;
  enabled: boolean;
  color?: string;
}
```

**Step 2: Commit**

```bash
git add frontend/src/types/
git commit -m "feat: add TypeScript types matching backend API models"
```

---

### Task 4: API Client + React Query Provider

**Files:**
- Create: `frontend/src/api/client.ts`
- Modify: `frontend/src/main.tsx`

**Step 1: Create Axios API client**

`frontend/src/api/client.ts`:
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
```

**Step 2: Wrap app in QueryClientProvider**

In `frontend/src/main.tsx`:
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
```

**Step 3: Verify app still renders**

Run `npm run dev`. Page should load without errors.

**Step 4: Commit**

```bash
git add frontend/src/api/ frontend/src/main.tsx
git commit -m "feat: add Axios API client and React Query provider"
```

---

### Task 5: React Query Hooks

**Files:**
- Create: `frontend/src/hooks/useTickers.ts`
- Create: `frontend/src/hooks/usePrices.ts`
- Create: `frontend/src/hooks/useSummary.ts`
- Create: `frontend/src/hooks/useHealth.ts`

**Step 1: Create useTickers hook**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { TickerResponse } from '../types';

export function useTickers() {
  return useQuery({
    queryKey: ['tickers'],
    queryFn: async (): Promise<TickerResponse[]> => {
      const { data } = await apiClient.get('/api/tickers');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useAddTicker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (symbol: string): Promise<TickerResponse> => {
      const { data } = await apiClient.post('/api/tickers', { symbol });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickers'] }),
  });
}

export function useRemoveTicker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (symbol: string): Promise<void> => {
      await apiClient.delete(`/api/tickers/${symbol}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickers'] }),
  });
}
```

**Step 2: Create usePrices hook**

```typescript
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { PriceResponse } from '../types';

export function usePrices(symbol: string, start?: string, end?: string) {
  return useQuery({
    queryKey: ['prices', symbol, start, end],
    queryFn: async (): Promise<PriceResponse> => {
      const params: Record<string, string> = {};
      if (start) params.start = start;
      if (end) params.end = end;
      const { data } = await apiClient.get(`/api/equity/${symbol}/prices`, { params });
      return data;
    },
    enabled: !!symbol,
    staleTime: 5 * 60_000,
  });
}
```

**Step 3: Create useSummary hook**

```typescript
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { SummaryResponse } from '../types';

export function useSummary(symbol: string) {
  return useQuery({
    queryKey: ['summary', symbol],
    queryFn: async (): Promise<SummaryResponse> => {
      const { data } = await apiClient.get(`/api/equity/${symbol}/summary`);
      return data;
    },
    enabled: !!symbol,
    staleTime: 60_000,
  });
}
```

**Step 4: Create useHealth hook and useIngest mutation**

`frontend/src/hooks/useHealth.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import type { IngestResponse } from '../types';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const { data } = await apiClient.get('/health');
      return data;
    },
    staleTime: 10_000,
  });
}

export function useIngest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<IngestResponse> => {
      const { data } = await apiClient.post('/api/ingest');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prices'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
    },
  });
}
```

**Step 5: Commit**

```bash
git add frontend/src/hooks/
git commit -m "feat: add React Query hooks for all API endpoints"
```

---

### Task 6: Zustand Store

**Files:**
- Create: `frontend/src/stores/uiStore.ts`

**Step 1: Create UI store**

```typescript
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
```

**Step 2: Commit**

```bash
git add frontend/src/stores/
git commit -m "feat: add Zustand UI store for sidebar, indicators, and time range"
```

---

### Task 7: Utility Functions

**Files:**
- Create: `frontend/src/lib/constants.ts`
- Create: `frontend/src/lib/formatters.ts`
- Create: `frontend/src/lib/indicators.ts`

**Step 1: Create constants**

`frontend/src/lib/constants.ts`:
```typescript
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
```

**Step 2: Create formatters**

`frontend/src/lib/formatters.ts`:
```typescript
export function formatPrice(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatVolume(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
```

**Step 3: Create indicator computation wrapper**

`frontend/src/lib/indicators.ts`:
```typescript
import { SMA, EMA, RSI, MACD, BollingerBands } from 'technicalindicators';

interface TimeValue {
  time: string;
  value: number;
}

export function computeSMA(closes: number[], dates: string[], period: number): TimeValue[] {
  const values = SMA.calculate({ period, values: closes });
  const offset = closes.length - values.length;
  return values.map((value, i) => ({ time: dates[i + offset], value }));
}

export function computeEMA(closes: number[], dates: string[], period: number): TimeValue[] {
  const values = EMA.calculate({ period, values: closes });
  const offset = closes.length - values.length;
  return values.map((value, i) => ({ time: dates[i + offset], value }));
}

export function computeRSI(closes: number[], dates: string[], period: number): TimeValue[] {
  const values = RSI.calculate({ period, values: closes });
  const offset = closes.length - values.length;
  return values.map((value, i) => ({ time: dates[i + offset], value }));
}

export function computeMACD(
  closes: number[],
  dates: string[],
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number
) {
  const results = MACD.calculate({
    values: closes,
    fastPeriod,
    slowPeriod,
    signalPeriod,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const offset = closes.length - results.length;
  return results.map((r, i) => ({
    time: dates[i + offset],
    macd: r.MACD ?? 0,
    signal: r.signal ?? 0,
    histogram: r.histogram ?? 0,
  }));
}

export function computeBollingerBands(
  closes: number[],
  dates: string[],
  period: number,
  stdDev: number
) {
  const results = BollingerBands.calculate({ period, values: closes, stdDev });
  const offset = closes.length - results.length;
  return results.map((r, i) => ({
    time: dates[i + offset],
    upper: r.upper,
    middle: r.middle,
    lower: r.lower,
  }));
}
```

**Step 4: Commit**

```bash
git add frontend/src/lib/
git commit -m "feat: add constants, formatters, and indicator computation utilities"
```

---

### Task 8: Common Components

**Files:**
- Create: `frontend/src/components/common/Card.tsx`
- Create: `frontend/src/components/common/Skeleton.tsx`
- Create: `frontend/src/components/common/Badge.tsx`
- Create: `frontend/src/components/common/SearchInput.tsx`
- Create: `frontend/src/components/ticker/PriceChange.tsx`

**Step 1: Create Card component**

```tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-surface-secondary border border-border-primary rounded-xl p-4
        ${onClick ? 'cursor-pointer hover:border-border-hover transition-colors duration-200' : ''}
        ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
```

**Step 2: Create Skeleton component**

```tsx
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`bg-surface-tertiary animate-pulse rounded ${className}`} />;
}
```

**Step 3: Create Badge component**

```tsx
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'bullish' | 'bearish';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const colors = {
    default: 'bg-accent/20 text-accent',
    bullish: 'bg-bullish/20 text-bullish',
    bearish: 'bg-bearish/20 text-bearish',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[variant]}`}>
      {children}
    </span>
  );
}
```

**Step 4: Create SearchInput component**

```tsx
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search...' }: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 bg-surface-tertiary border border-border-primary rounded-lg
          text-slate-50 placeholder-slate-500
          focus:border-accent focus:ring-1 focus:ring-accent/50 focus:outline-none
          transition-colors duration-200"
      />
    </div>
  );
}
```

**Step 5: Create PriceChange component**

```tsx
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceChangeProps {
  value: number;
  className?: string;
}

export function PriceChange({ value, className = '' }: PriceChangeProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const color = isPositive ? 'text-bullish' : isNegative ? 'text-bearish' : 'text-slate-400';
  const sign = isPositive ? '+' : '';

  return (
    <span className={`inline-flex items-center gap-1 font-mono text-sm ${color} ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {sign}{value.toFixed(2)}%
    </span>
  );
}
```

**Step 6: Verify components render**

Import and render each component in `App.tsx` temporarily. Run `npm run dev`, check no errors and styles look correct.

**Step 7: Commit**

```bash
git add frontend/src/components/
git commit -m "feat: add common UI components (Card, Skeleton, Badge, SearchInput, PriceChange)"
```

---

### Task 9: Layout Components

**Files:**
- Create: `frontend/src/components/layout/Sidebar.tsx`
- Create: `frontend/src/components/layout/TopBar.tsx`
- Create: `frontend/src/components/layout/AppLayout.tsx`

**Step 1: Create Sidebar**

Navigation items: Dashboard (LayoutDashboard), Chart (CandlestickChart), Watchlist (Eye), Portfolio (Briefcase), Screener (SlidersHorizontal).

Uses `react-router-dom`'s `NavLink` for active state. Reads `sidebarCollapsed` from Zustand. Responsive: full at >= 1024px, collapsed at >= 768px, hidden at < 768px with overlay.

**Step 2: Create TopBar**

Logo left, search center, ingest button + health indicator right. Search filters registered tickers and navigates to `/chart/{symbol}`.

**Step 3: Create AppLayout**

Wraps Sidebar + TopBar + `<Outlet />` from React Router. Handles the padding/offset for fixed sidebar and top bar.

**Step 4: Verify layout renders**

Set up basic routing in `App.tsx` with `BrowserRouter`, `Routes`, `Route` wrapping `AppLayout` as parent route with child placeholder routes. Run `npm run dev`, verify sidebar + topbar render with correct dark styling.

**Step 5: Commit**

```bash
git add frontend/src/components/layout/ frontend/src/App.tsx
git commit -m "feat: add layout components (Sidebar, TopBar, AppLayout) with routing"
```

---

### Task 10: Routing Setup

**Files:**
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/pages/Dashboard.tsx` (stub)
- Create: `frontend/src/pages/Chart.tsx` (stub)
- Create: `frontend/src/pages/Watchlist.tsx` (stub)
- Create: `frontend/src/pages/Portfolio.tsx` (stub)
- Create: `frontend/src/pages/Screener.tsx` (stub)

**Step 1: Create page stubs**

Each page is a simple component with the page title for now:
```tsx
export default function Dashboard() {
  return <div className="text-slate-50"><h1 className="text-2xl font-semibold">Dashboard</h1></div>;
}
```

**Step 2: Set up routes in App.tsx**

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Chart from './pages/Chart';
import Watchlist from './pages/Watchlist';
import Portfolio from './pages/Portfolio';
import Screener from './pages/Screener';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chart/:symbol?" element={<Chart />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/screener" element={<Screener />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

**Step 3: Verify navigation**

Run `npm run dev`. Click each sidebar nav item, verify URL changes and correct page title renders. Verify active state styling on sidebar.

**Step 4: Commit**

```bash
git add frontend/src/App.tsx frontend/src/pages/
git commit -m "feat: add React Router routes with page stubs"
```

---

### Task 11: Dashboard Page

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`
- Create: `frontend/src/components/ticker/TickerCard.tsx`
- Create: `frontend/src/components/ticker/AddTickerModal.tsx`
- Create: `frontend/src/components/ticker/SparklineChart.tsx`

**Step 1: Create SparklineChart component**

A tiny Lightweight Charts area chart (no axes, no grid) that renders last 30 days of closing prices. Takes `data: { time: string; value: number }[]` as prop. Uses a `useRef` for the chart container and `useEffect` for chart lifecycle.

**Step 2: Create TickerCard component**

Displays: symbol, latest close, daily change (PriceChange component), sparkline, volume, 52w range. Fetches data via `useSummary(symbol)` and `usePrices(symbol)` (last 30 days for sparkline). Clicking navigates to `/chart/{symbol}` via `useNavigate`.

**Step 3: Create AddTickerModal component**

A dialog/modal with: symbol input (uppercase, validated), submit button, loading state, error display. Uses `useAddTicker` mutation. Closes on success.

**Step 4: Build Dashboard page**

Header with "Market Overview" title and "Add Ticker" button. Grid of TickerCards (responsive columns via Tailwind grid). Uses `useTickers()` to get list. Maps each ticker to `<TickerCard symbol={t.symbol} />`. Handles loading (skeleton grid), empty ("No tickers yet"), and error states.

**Step 5: Verify with backend**

Start backend (`uvicorn flow.api.app:app`), start frontend (`npm run dev`). Add a ticker, verify card appears with real data. Verify sparkline renders.

**Step 6: Commit**

```bash
git add frontend/src/pages/Dashboard.tsx frontend/src/components/ticker/
git commit -m "feat: build Dashboard page with ticker cards, sparklines, and add ticker modal"
```

---

### Task 12: Charting Page - Candlestick Chart

**Files:**
- Modify: `frontend/src/pages/Chart.tsx`
- Create: `frontend/src/components/chart/CandlestickChart.tsx`
- Create: `frontend/src/components/chart/ChartToolbar.tsx`
- Create: `frontend/src/components/chart/SymbolHeader.tsx`

**Step 1: Create CandlestickChart component**

Uses Lightweight Charts `createChart()` in a `useRef` container. Renders candlestick series from OHLCV data. Adds volume as a histogram series in the same chart (bottom pane, 20% height). Configures colors from `CHART_COLORS` constants. Handles resize via `ResizeObserver`. Cleans up chart on unmount.

Props: `data: OHLCVRow[]`, `overlays?: { data: TimeValue[]; color: string }[]`

**Step 2: Create ChartToolbar**

Symbol selector dropdown (populated from `useTickers`), time range buttons (1M-ALL, active state styled), indicators toggle dropdown. Uses Zustand store for time range and indicator state.

**Step 3: Create SymbolHeader**

Displays symbol, latest close (large monospace), change amount/percent (PriceChange), 52-week range progress bar. Uses `useSummary(symbol)`.

**Step 4: Build Chart page**

Reads `:symbol` from URL params. If no symbol, shows prompt to select one. Fetches prices via `usePrices(symbol, startDate)` where `startDate` comes from `getStartDateForRange(timeRange)`. Passes data to CandlestickChart. Loading/error states.

**Step 5: Verify chart renders**

Navigate to `/chart/AAPL` (or any registered ticker). Verify candlesticks render with correct colors, volume bars show below, crosshair tooltip works, zoom/pan works.

**Step 6: Commit**

```bash
git add frontend/src/pages/Chart.tsx frontend/src/components/chart/
git commit -m "feat: build Chart page with candlestick chart, toolbar, and symbol header"
```

---

### Task 13: Charting Page - Indicators

**Files:**
- Modify: `frontend/src/components/chart/CandlestickChart.tsx`
- Create: `frontend/src/components/chart/IndicatorPanel.tsx`
- Create: `frontend/src/components/chart/IndicatorsDropdown.tsx`

**Step 1: Add overlay indicators to CandlestickChart**

When SMA/EMA/Bollinger are enabled in Zustand, compute them from price data using `lib/indicators.ts` and add as line series to the chart. Bollinger adds upper/lower as additional line series.

**Step 2: Create IndicatorPanel for sub-chart indicators**

RSI: Separate Lightweight Charts instance below main chart (~150px height). Renders RSI line with horizontal dashed lines at 30 and 70.

MACD: Separate chart below RSI (~150px). Renders MACD line, signal line, and histogram as a histogram series.

**Step 3: Create IndicatorsDropdown**

Popover/dropdown listing all indicators with toggle switches. When an indicator is toggled, it shows/hides on the chart. For each indicator, show inline parameter editing (e.g., period input for SMA).

**Step 4: Wire indicators into Chart page**

Read enabled indicators from Zustand. Compute indicator data from price data. Pass overlays to CandlestickChart. Render IndicatorPanel components below chart for RSI/MACD when enabled.

**Step 5: Verify indicators**

Enable SMA 20 and RSI -- verify SMA line overlays on chart, RSI panel appears below. Toggle off -- verify they disappear. Change SMA period -- verify line updates.

**Step 6: Commit**

```bash
git add frontend/src/components/chart/ frontend/src/pages/Chart.tsx
git commit -m "feat: add technical indicators (SMA, EMA, RSI, MACD, Bollinger) to chart"
```

---

### Task 14: Watchlist Page

**Files:**
- Modify: `frontend/src/pages/Watchlist.tsx`
- Create: `frontend/src/components/ticker/TickerRow.tsx`
- Create: `frontend/src/components/ticker/RangeBar.tsx`

**Step 1: Create RangeBar component**

A small visual progress bar showing where current price sits within 52-week range. Props: `low`, `high`, `current`.

**Step 2: Create TickerRow component**

A table row showing: symbol (clickable, links to chart), last price (monospace), change %, volume (formatted), 52w range (RangeBar), remove button (X icon with confirmation).

**Step 3: Build Watchlist page**

Header with "Watchlist" title and "Add Ticker" button (reuses AddTickerModal). Sortable table: click column headers to sort. Default sort: alphabetical. Uses `useTickers()` for the list, `useSummary(symbol)` for each row's data. Loading state: skeleton rows. Empty state: centered message with add button.

**Step 4: Verify watchlist**

Navigate to `/watchlist`. Verify table renders with data, sorting works, clicking symbol navigates to chart, remove button deletes ticker.

**Step 5: Commit**

```bash
git add frontend/src/pages/Watchlist.tsx frontend/src/components/ticker/
git commit -m "feat: build Watchlist page with sortable table and ticker management"
```

---

### Task 15: Placeholder Pages

**Files:**
- Modify: `frontend/src/pages/Portfolio.tsx`
- Modify: `frontend/src/pages/Screener.tsx`

**Step 1: Build Portfolio placeholder**

Centered Card with Briefcase icon (Lucide, 48px, slate-500), "Portfolio Coming Soon" heading (Inter 600), description text (slate-400). Styled consistently with app theme.

**Step 2: Build Screener placeholder**

Same pattern with SlidersHorizontal icon and "Screener Coming Soon" copy.

**Step 3: Verify both pages**

Navigate to `/portfolio` and `/screener`. Verify they render the placeholder UI correctly.

**Step 4: Commit**

```bash
git add frontend/src/pages/Portfolio.tsx frontend/src/pages/Screener.tsx
git commit -m "feat: add placeholder pages for Portfolio and Screener"
```

---

### Task 16: Polish & Integration

**Files:**
- Various components for refinements

**Step 1: Verify responsive behavior**

Test at 375px, 768px, 1024px, 1440px. Verify sidebar collapses, grid columns adjust, chart resizes, table scrolls horizontally on mobile.

**Step 2: Verify loading states**

Throttle network in DevTools. Verify skeleton screens appear on Dashboard (cards), Chart (chart area), Watchlist (table rows).

**Step 3: Verify error handling**

Stop the backend. Verify error states render with retry buttons on all pages.

**Step 4: Accessibility check**

- All clickable elements have `cursor-pointer`
- Focus states visible on all interactive elements
- Color is not the only indicator (arrows + color for price changes)
- All images/icons have accessible labels where needed

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: polish responsive behavior, loading states, error handling, and accessibility"
```
