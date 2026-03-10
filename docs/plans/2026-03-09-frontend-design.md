# Flow Frontend Design

## Overview

A professional stock market charting web application built with React, Vite, and Tailwind CSS. The frontend consumes the existing Flow FastAPI backend to display OHLCV price data, technical indicators, and ticker management across five pages: Dashboard, Charting, Watchlist, Portfolio (placeholder), and Screener (placeholder).

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Charting library | Lightweight Charts (TradingView) | Open-source, ~40KB, professional candlestick rendering, full data control |
| Technical indicators | Client-side (`technicalindicators`) | No backend changes needed, instant parameter tweaking |
| Portfolio page | Placeholder | Defer to focus on core charting/watchlist features |
| Screener page | Placeholder | Defer to focus on core features |
| Visual direction | Dark-first polished/modern | Standard for trading platforms, optimized for data density |
| Architecture | TanStack Query + Zustand | Query handles server state caching/dedup; Zustand for UI-only state |

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Server State | TanStack React Query v5 |
| Client State | Zustand |
| Charts | Lightweight Charts (TradingView) |
| Indicators | `technicalindicators` (client-side) |
| Icons | Lucide React |
| HTTP | Axios |

## Project Structure

```
frontend/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── public/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/
│   │   └── client.ts
│   ├── hooks/
│   │   ├── usePrices.ts
│   │   ├── useSummary.ts
│   │   ├── useTickers.ts
│   │   └── useIndicators.ts
│   ├── stores/
│   │   └── uiStore.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── AppLayout.tsx
│   │   ├── chart/
│   │   │   ├── CandlestickChart.tsx
│   │   │   ├── VolumeChart.tsx
│   │   │   └── IndicatorOverlay.tsx
│   │   ├── common/
│   │   │   ├── Card.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── SearchInput.tsx
│   │   └── ticker/
│   │       ├── TickerRow.tsx
│   │       ├── TickerSummary.tsx
│   │       └── PriceChange.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Chart.tsx
│   │   ├── Watchlist.tsx
│   │   ├── Portfolio.tsx
│   │   └── Screener.tsx
│   ├── lib/
│   │   ├── indicators.ts
│   │   ├── formatters.ts
│   │   └── constants.ts
│   └── types/
│       └── index.ts
```

The `frontend/` directory lives at the repo root alongside the existing Python `src/` backend.

## Design System

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#020617` (slate-950) | Main background |
| `bg-secondary` | `#0F172A` (slate-900) | Cards, sidebar |
| `bg-tertiary` | `#1E293B` (slate-800) | Hover states, inputs, elevated cards |
| `text-primary` | `#F8FAFC` (slate-50) | Headings, primary text |
| `text-secondary` | `#94A3B8` (slate-400) | Muted text, labels |
| `border` | `#334155` (slate-700) | Card borders, dividers |
| `accent` | `#3B82F6` (blue-500) | Active nav, links, primary actions |
| `bullish` | `#22C55E` (green-500) | Price up, positive P&L |
| `bearish` | `#EF4444` (red-500) | Price down, negative P&L |
| `volume` | `#3B82F6` at 40% opacity | Volume bars |

### Typography

- **Headings & UI**: Inter -- clean, professional, excellent readability
- **Data & Numbers**: Fira Code (monospace) -- aligned decimal columns, price tickers
- Weights: 400 (body), 500 (labels), 600 (headings), 700 (key metrics)

### Component Styling

- **Cards**: `bg-slate-900 border border-slate-700 rounded-xl` with `hover:border-slate-600 transition-colors duration-200`
- **Sidebar**: Fixed left, `w-64`, `bg-slate-900/95 backdrop-blur-sm border-r border-slate-700`
- **Inputs**: `bg-slate-800 border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50`
- **Skeleton loading**: `bg-slate-800 animate-pulse rounded`

### Chart Colors

| Element | Color |
|---------|-------|
| Candlestick bullish | `#22C55E`, wick `#16A34A` |
| Candlestick bearish | `#EF4444`, wick `#DC2626` |
| Chart background | `#020617` |
| Grid lines | `#1E293B` |
| Crosshair | `#94A3B8` at 50% |
| SMA overlay | `#3B82F6` (blue) |
| EMA overlay | `#F59E0B` (amber) |
| Bollinger overlay | `#8B5CF6` (violet) |

### UX Rules

- No emojis as icons -- Lucide React SVGs throughout
- `cursor-pointer` on all clickable elements
- Skeleton screens during loading (no blank states)
- Active nav: accent color + left border indicator
- All numbers in monospace font for alignment
- Price changes show color + directional arrow icon (not color alone)
- Transitions: `transition-colors duration-200` on all interactive elements

## Layout & Navigation

### App Shell

Fixed sidebar (left) + top bar (top) layout.

**TopBar** (h-14):
- Left: "Flow" logo text (Inter 700, accent blue)
- Center: Global ticker search (type to search registered tickers, click navigates to chart)
- Right: "Ingest" button (triggers `POST /api/ingest`), health status indicator (green dot)

**Sidebar** (w-64, fixed):
- Nav items: icon + label, stacked vertically
- Active: `bg-slate-800 text-blue-500 border-l-2 border-blue-500`
- Inactive: `text-slate-400 hover:text-slate-200 hover:bg-slate-800/50`
- Collapsible: icon-only (`w-16`) at `< 1024px`; hidden with hamburger at `< 768px`

### Responsive Behavior

| Breakpoint | Sidebar | Content |
|------------|---------|---------|
| >= 1440px | Full (w-64) | Spacious |
| >= 1024px | Full (w-64) | Standard |
| >= 768px | Collapsed (w-16, icons only) | Full width |
| < 768px | Hidden, hamburger overlay | Full width |

### Routes

| Path | Page |
|------|------|
| `/` | Dashboard |
| `/chart/:symbol?` | Chart |
| `/watchlist` | Watchlist |
| `/portfolio` | Portfolio (placeholder) |
| `/screener` | Screener (placeholder) |

## Pages

### Dashboard

Market overview showing all registered tickers as a card grid.

**Ticker Card** (data from `/api/equity/{symbol}/summary`):
- Symbol (bold)
- Latest close price (large, monospace)
- Daily change percent (green/red + arrow)
- Mini sparkline: last 30 days closing prices (Lightweight Charts area, accent blue, no axes)
- 30d avg volume (formatted: 52.3M)
- 52-week range (low -- high)
- Clicking navigates to `/chart/{symbol}`

**Grid**: 4 cols at 1440px, 3 at 1024px, 2 at 768px, 1 below.

**Add Ticker**: Button opens modal with symbol input. Calls `POST /api/tickers`. Shows loading during backfill.

**States**: Skeleton cards (loading), "No tickers yet" + add button (empty), error card with retry.

### Charting

Full-featured candlestick chart with indicators.

**Toolbar**:
- Symbol selector dropdown (registered tickers, also via URL param)
- Time range buttons: 1M, 3M, 6M, 1Y, 5Y, ALL (filters `start` param)
- Indicators toggle dropdown

**Chart Area**:
- Candlestick chart via Lightweight Charts, fills available width, min height ~400px
- Volume bars in bottom pane (20% of chart height)
- Crosshair with OHLCV tooltip on hover
- Mouse scroll zoom, click-drag pan, double-click auto-fit

**Symbol Header**:
- Symbol + latest close (large monospace) + change (colored + arrow)
- 52-week range as visual progress bar

**Overlay Indicators** (on price chart):

| Indicator | Default Params | Color |
|-----------|---------------|-------|
| SMA | 20, 50, 200 | Blue, Amber, Violet |
| EMA | 12, 26 | Cyan, Orange |
| Bollinger Bands | 20 period, 2 std | Gray with fill |

**Sub-chart Indicators** (separate panels below):

| Indicator | Default Params | Rendering |
|-----------|---------------|-----------|
| RSI | 14 period | Line with 30/70 dashed bands |
| MACD | 12, 26, 9 | Two lines + histogram bars |

Indicator toggle and parameter editing via Indicators dropdown. State persists in Zustand across symbol changes.

**States**: Prompt to select ticker (no symbol), skeleton (loading), error with retry, "no data" message.

### Watchlist

Dense sortable table of all registered tickers.

**Columns**: Symbol (clickable, links to chart), Last price, Change %, 30d Avg Volume, 52w Range (progress bar), Remove button.

**Behaviors**:
- Sortable columns (click header, asc/desc toggle)
- Row hover highlight
- Remove: X button with confirmation tooltip, calls `DELETE /api/tickers/{symbol}`
- Add ticker: Same modal as Dashboard

**States**: Skeleton rows (loading), "watchlist is empty" + add button (empty), error banner with retry.

### Portfolio (Placeholder)

Centered card with Briefcase icon, "Portfolio Coming Soon" heading, short description. Styled to match dark theme.

### Screener (Placeholder)

Centered card with SlidersHorizontal icon, "Screener Coming Soon" heading, short description. Styled to match dark theme.

## Data Layer

### API Client

Axios instance with `baseURL` from `VITE_API_URL` (defaults to `/api`). Response interceptors for error normalization. TypeScript types matching backend Pydantic models.

### React Query Hooks

| Hook | Endpoint | Cache Key | Stale Time |
|------|----------|-----------|------------|
| `useTickers` | `GET /api/tickers` | `['tickers']` | 30s |
| `usePrices(symbol, start?, end?)` | `GET /api/equity/{symbol}/prices` | `['prices', symbol, start, end]` | 5 min |
| `useSummary(symbol)` | `GET /api/equity/{symbol}/summary` | `['summary', symbol]` | 60s |
| `useAddTicker` | `POST /api/tickers` | mutation, invalidates `['tickers']` | -- |
| `useRemoveTicker` | `DELETE /api/tickers/{symbol}` | mutation, invalidates `['tickers']` | -- |
| `useIngest` | `POST /api/ingest` | mutation, invalidates `['prices', 'summary']` | -- |
| `useHealth` | `GET /health` | `['health']` | 10s |

### Zustand Store

```typescript
interface UIState {
  sidebarCollapsed: boolean;
  selectedIndicators: IndicatorConfig[];
  chartTimeRange: '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL';
  toggleSidebar: () => void;
  setIndicators: (indicators: IndicatorConfig[]) => void;
  setTimeRange: (range: string) => void;
}
```

Only pure UI state -- no server data.

### Indicator Computation

Thin wrapper around `technicalindicators` in `lib/indicators.ts`:
- `computeSMA(data, period)`, `computeEMA(data, period)`, `computeRSI(data, period)`, `computeMACD(data, fast, slow, signal)`, `computeBollingerBands(data, period, stdDev)`
- Each returns data in Lightweight Charts format: `{ time, value }[]`

### Vite Dev Proxy

Dev server proxies `/api` to `http://localhost:8000` for seamless backend integration during development.
