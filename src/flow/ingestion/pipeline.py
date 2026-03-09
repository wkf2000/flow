import json
import logging
from datetime import date, timedelta
from pathlib import Path

from flow.config import Settings, settings as default_settings
from flow.ingestion.fetcher import FetchError, fetch_historical
from flow.models import IngestResult, TickerInfo
from flow.storage.parquet import get_last_date, write_ohlcv

logger = logging.getLogger(__name__)


def load_ticker_registry(settings: Settings | None = None) -> dict[str, TickerInfo]:
    s = settings or default_settings
    path = s.tickers_path
    if not path.exists():
        return {}
    raw = json.loads(path.read_text())
    return {symbol: TickerInfo(**info) for symbol, info in raw.items()}


def save_ticker_registry(
    registry: dict[str, TickerInfo],
    settings: Settings | None = None,
) -> None:
    s = settings or default_settings
    s.tickers_path.parent.mkdir(parents=True, exist_ok=True)
    data = {
        symbol: info.model_dump(mode="json")
        for symbol, info in registry.items()
    }
    s.tickers_path.write_text(json.dumps(data, indent=2) + "\n")


def add_ticker(
    symbol: str,
    settings: Settings | None = None,
) -> TickerInfo:
    """Register a new ticker. Does not trigger ingestion."""
    s = settings or default_settings
    registry = load_ticker_registry(s)
    symbol = symbol.upper()

    if symbol in registry:
        return registry[symbol]

    info = TickerInfo(added=date.today())
    registry[symbol] = info
    save_ticker_registry(registry, s)
    logger.info("Added ticker %s", symbol)
    return info


def remove_ticker(
    symbol: str,
    settings: Settings | None = None,
) -> bool:
    s = settings or default_settings
    registry = load_ticker_registry(s)
    symbol = symbol.upper()
    if symbol not in registry:
        return False
    del registry[symbol]
    save_ticker_registry(registry, s)
    logger.info("Removed ticker %s", symbol)
    return True


def backfill(
    symbol: str,
    settings: Settings | None = None,
) -> IngestResult:
    """Full historical backfill for a single ticker."""
    s = settings or default_settings
    symbol = symbol.upper()
    provider = s.default_provider

    registry = load_ticker_registry(s)
    if symbol not in registry:
        add_ticker(symbol, s)
        registry = load_ticker_registry(s)

    try:
        df = fetch_historical(symbol, start_date=s.backfill_start_date, provider=provider)
    except FetchError as e:
        logger.error("Backfill failed for %s: %s", symbol, e)
        return IngestResult(symbol=symbol, rows_fetched=0, rows_written=0, status="error")

    rows_fetched = len(df)
    rows_written = write_ohlcv(df, symbol, provider, settings=s)

    registry[symbol].last_ingested = date.today()
    save_ticker_registry(registry, s)

    logger.info("Backfill complete for %s: %d fetched, %d written", symbol, rows_fetched, rows_written)
    return IngestResult(
        symbol=symbol,
        rows_fetched=rows_fetched,
        rows_written=rows_written,
        status="ok",
    )


def incremental_ingest(
    symbol: str,
    settings: Settings | None = None,
) -> IngestResult:
    """Incremental update for a single ticker using overlap window."""
    s = settings or default_settings
    symbol = symbol.upper()
    provider = s.default_provider

    last = get_last_date(symbol, provider, settings=s)
    if last is None:
        logger.info("No existing data for %s, falling back to backfill", symbol)
        return backfill(symbol, s)

    start = last - timedelta(days=s.overlap_days)

    try:
        df = fetch_historical(symbol, start_date=start, provider=provider)
    except FetchError as e:
        logger.error("Incremental ingest failed for %s: %s", symbol, e)
        return IngestResult(symbol=symbol, rows_fetched=0, rows_written=0, status="error")

    rows_fetched = len(df)
    rows_written = write_ohlcv(df, symbol, provider, settings=s)

    registry = load_ticker_registry(s)
    if symbol in registry:
        registry[symbol].last_ingested = date.today()
        save_ticker_registry(registry, s)

    logger.info("Incremental ingest for %s: %d fetched, %d written", symbol, rows_fetched, rows_written)
    return IngestResult(
        symbol=symbol,
        rows_fetched=rows_fetched,
        rows_written=rows_written,
        status="ok",
    )


def ingest_all(
    settings: Settings | None = None,
) -> list[IngestResult]:
    """Run incremental ingest for all registered tickers."""
    s = settings or default_settings
    registry = load_ticker_registry(s)
    results = []
    for symbol in sorted(registry):
        result = incremental_ingest(symbol, s)
        results.append(result)
    return results
