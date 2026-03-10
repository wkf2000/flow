# Flow

Stock market data platform with OHLCV ingestion, technical charting, and a professional dark-themed web interface.

## Architecture

```
┌─────────────────┐       ┌──────────────────┐       ┌────────────────┐
│   React Frontend │──────▶│  FastAPI Backend  │──────▶│ Parquet + DuckDB│
│   (Vite + TW)    │  /api │  (uvicorn)       │       │  (data/equity)  │
└─────────────────┘       └──────────────────┘       └────────────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │ OpenBB / yfinance │
                          │  (data provider)  │
                          └──────────────────┘
```

**Backend** — FastAPI serving OHLCV price data, ticker management, and summary statistics. Data is ingested from yfinance via OpenBB, stored in Parquet files with Hive-style partitioning, and queried through DuckDB.

**Frontend** — React SPA with candlestick charting (Lightweight Charts), client-side technical indicators, and a dark fintech UI. Communicates with the backend via REST API.

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/) (recommended) or pip

### Backend

```bash
# Install dependencies
uv sync

# Add a ticker and backfill historical data
uv run flow add AAPL
uv run flow add MSFT

# Start the API server
uv run flow serve
```

The API runs at `http://localhost:8000`. See [API Endpoints](#api-endpoints) below.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173` with automatic proxy to the backend.

### Docker

```bash
cp .env.example .env
docker compose up -d
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/tickers` | List registered tickers |
| `POST` | `/api/tickers` | Add ticker (triggers backfill) |
| `DELETE` | `/api/tickers/{symbol}` | Remove ticker and its data |
| `GET` | `/api/equity/{symbol}/prices` | OHLCV price data (`?start=&end=`) |
| `GET` | `/api/equity/{symbol}/summary` | 52w high/low, avg volume, latest close |
| `POST` | `/api/ingest` | Run incremental ingest for all tickers |

## Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Ticker card grid with sparkline charts and summary stats |
| Chart | `/chart/:symbol` | Candlestick chart with volume, SMA/EMA/Bollinger overlays, RSI/MACD sub-panels |
| Watchlist | `/watchlist` | Sortable data table of all tracked tickers |
| Portfolio | `/portfolio` | Coming soon |
| Screener | `/screener` | Coming soon |

## Tech Stack

### Backend

| Component | Technology |
|-----------|-----------|
| API | FastAPI + Uvicorn |
| Data ingestion | OpenBB + yfinance |
| Storage | Parquet (PyArrow) |
| Query engine | DuckDB |
| CLI | Typer |
| Config | Pydantic Settings |

### Frontend

| Component | Technology |
|-----------|-----------|
| Framework | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 (dark theme) |
| Charting | Lightweight Charts (TradingView) |
| Indicators | technicalindicators (client-side) |
| Server state | TanStack React Query v5 |
| Client state | Zustand |
| Routing | React Router v7 |
| Icons | Lucide React |

## CLI Reference

```bash
flow add <SYMBOL>       # Add ticker and backfill from 2005
flow remove <SYMBOL>    # Remove ticker and its data
flow list               # List registered tickers
flow backfill <SYMBOL>  # Re-backfill a ticker
flow ingest             # Incremental ingest for all tickers
flow serve              # Start the API server
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8510` | Host port mapping (Docker) |
| `FLOW_DATA_DIR` | `data` | Directory for Parquet files and ticker registry |
| `FLOW_DEFAULT_PROVIDER` | `yfinance` | Data provider |
| `FLOW_BACKFILL_START_DATE` | `2005-01-01` | How far back to fetch on first add |
| `FLOW_OVERLAP_DAYS` | `5` | Days of overlap during incremental ingest |

## Project Structure

```
flow/
├── src/flow/
│   ├── api/              # FastAPI app and routes
│   ├── ingestion/        # Data fetching and pipeline
│   ├── storage/          # Parquet writing and DuckDB queries
│   ├── cli.py            # Typer CLI
│   ├── config.py         # Pydantic settings
│   └── models.py         # Request/response models
├── frontend/
│   └── src/
│       ├── api/          # Axios client
│       ├── components/   # Chart, layout, common, ticker components
│       ├── hooks/        # React Query hooks
│       ├── lib/          # Indicators, formatters, constants
│       ├── pages/        # Dashboard, Chart, Watchlist, Portfolio, Screener
│       ├── stores/       # Zustand UI store
│       └── types/        # TypeScript interfaces
├── tests/                # pytest test suite
├── docker-compose.yml
├── Dockerfile
└── pyproject.toml
```

## License

Private.
