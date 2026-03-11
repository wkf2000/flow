# ADR 0001: Overall System Architecture

## Status

Accepted — initial system architecture for Flow.

## Context

Flow is a stock market data platform focused on:

- Ingesting daily OHLCV data for a small-to-medium set of tickers.
- Storing that data efficiently on disk.
- Serving fast read-heavy workloads for charts and summary statistics.
- Providing a modern, responsive, dark-themed web UI with technical indicators rendered client-side.

The system needs to be:

- Simple enough for a single developer or small team to operate.
- Local-first and easy to run via CLI or Docker.
- Cost-efficient (no managed databases required by default).
- Extensible to additional analytics and pages (portfolio, screener, more indicators).

We needed to decide:

1. How the frontend, backend, and storage layers should be structured.
2. How market data should be fetched and ingested.
3. How to store and query time-series OHLCV data.

## Decision

We will adopt the following architecture:

- **Frontend**: React SPA (Vite + TypeScript + Tailwind CSS) served separately from the API.
- **Backend API**: FastAPI application (served by Uvicorn) exposing REST endpoints under `/api`.
- **Data ingestion**: Python ingestion pipeline using OpenBB/yfinance to fetch historical and incremental OHLCV data.
- **Storage**: Local Parquet files in a Hive-style directory layout, queried through DuckDB.
- **CLI**: Typer-based CLI (`flow`) to manage tickers, ingestion, and serving the API.

The high-level system diagram:

```text
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

### Frontend

- React SPA using Vite, TypeScript, Tailwind CSS (dark theme).
- Charting via Lightweight Charts (TradingView) with client-side indicators (SMA, EMA, RSI, MACD, Bollinger Bands).
- Server state via TanStack React Query; UI state via Zustand; routing via React Router.
- The frontend talks only to the FastAPI backend over HTTP (`/api/...`), never directly to data providers.

### Backend API

- FastAPI app exposes routes for:
  - Ticker management (`/api/tickers`).
  - Price data (`/api/equity/{symbol}/prices`).
  - Summary statistics (`/api/equity/{symbol}/summary`).
  - Ingestion trigger for all tickers (`/api/ingest`).
- The backend is stateless aside from:
  - The ticker registry (stored on disk under the data directory).
  - The Parquet files containing OHLCV data.
- The same backend package is used by both the HTTP API and the CLI to avoid duplicated ingestion logic.

### Ingestion pipeline

- Ingestion is implemented as a Python pipeline that:
  - Uses OpenBB/yfinance to fetch historical and incremental OHLCV data.
  - Normalizes responses into a canonical schema.
  - Writes to Parquet partitions on disk via PyArrow.
- When a ticker is added:
  - It is recorded in the ticker registry.
  - A background task performs a historical backfill from a configurable start date.
- Ongoing ingestion:
  - `ingest_all` runs incremental ingestion for all registered tickers, using a small overlap window to handle late data and adjustments.

### Storage & query

- Data is stored as Parquet files in a Hive-style layout under a configurable `FLOW_DATA_DIR` (e.g. partitioned by symbol/year/provider).
- DuckDB is used:
  - As an embedded analytical query engine on top of Parquet.
  - To answer price and summary queries with good performance and low operational overhead.
- This avoids the need to provision and manage a separate OLAP database while still supporting analytical-style queries.

### CLI

- Typer-based `flow` CLI is the main operational entrypoint:
  - `flow add/remove/list/backfill/ingest` manage tickers and ingestion.
  - `flow serve` runs the FastAPI app via Uvicorn.
- The CLI directly reuses the same pipeline and storage modules as the API.

## Alternatives Considered

1. **Monolithic DB-centric architecture (Postgres/MySQL)**
   - Store OHLCV data in relational tables.
   - Use an ORM to query from the API.
   - Pros:
     - Familiar to many developers.
     - Strong transactional guarantees.
   - Cons:
     - Managing large time-series in a row-store is less efficient than columnar storage for analytical queries.
     - Higher operational overhead (database provisioning, backups, configuration).
     - Harder to ship as a fully self-contained local tool.

2. **Streaming/real-time ingestion with message queues**
   - Ingest ticks or bars via Kafka/PubSub and stream-process into storage.
   - Pros:
     - Better suited for intraday or tick-level data.
     - Scales to high-throughput, low-latency scenarios.
   - Cons:
     - Significantly more complex infrastructure.
     - Overkill for daily or end-of-day OHLCV use cases.
     - Harder to run locally with minimal dependencies.

3. **Single-page app tightly coupled to backend templates**
   - Server-rendered pages (e.g. Jinja2) with minimal client-side logic.
   - Pros:
     - Simpler deployment topology.
     - Fewer moving parts for very basic UIs.
   - Cons:
     - Poor fit for rich, interactive charting and client-side indicators.
     - Less flexible for future expansion of dashboard-style features.

## Consequences

### Positive

- **Low operational overhead**: Parquet + DuckDB + local files avoid external databases by default.
- **Great developer ergonomics**: Python ingestion/analytics and React UI are decoupled but well-defined.
- **Strong fit for read-heavy analytics**: Columnar Parquet + DuckDB is ideal for time-series queries.
- **Local-first**: Easy to run everything via CLI or Docker without cloud dependencies.
- **Frontend flexibility**: Rich SPA experience with client-side charting and indicators.

### Negative / Trade-offs

- **Not real-time**: Architecture is optimized for daily/incremental OHLCV, not low-latency streaming.
- **Local file storage**: Scaling beyond a single node will require revisiting storage (e.g. object storage with DuckDB or external warehouse).
- **Embedded query engine**: DuckDB runs inside the API process; very heavy queries could affect API latency if not managed carefully.

## Future Work

- Evaluate moving Parquet storage to object storage (e.g. S3-compatible) while keeping DuckDB as the query engine.
- Introduce a proper task queue and worker model if ingestion workloads or background jobs become heavier.
- Add ADRs for:
  - Ingestion strategy (backfill vs incremental design).
  - Indicator computation location (client-side vs server-side).
  - Multi-environment deployment strategy (local, staging, production).

