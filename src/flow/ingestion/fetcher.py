import logging
import time
from datetime import date
from typing import Any

import pandas as pd

logger = logging.getLogger(__name__)

_RATE_LIMIT_DELAY = 1.0  # seconds between API calls

_CANONICAL_COLUMNS = [
    "date", "open", "high", "low", "close", "volume",
    "vwap", "split_ratio", "dividend",
]


class FetchError(Exception):
    pass


def _get_obb() -> Any:
    from openbb import obb
    return obb


def fetch_historical(
    symbol: str,
    start_date: str | date | None = None,
    end_date: str | date | None = None,
    provider: str = "yfinance",
    *,
    _obb: Any | None = None,
) -> pd.DataFrame:
    """Fetch historical OHLCV data via OpenBB.

    Returns a normalized DataFrame with canonical columns.
    The _obb parameter exists for testing; production code leaves it as None.
    """
    obb = _obb or _get_obb()

    kwargs: dict = {"symbol": symbol, "provider": provider}
    if start_date:
        kwargs["start_date"] = str(start_date)
    if end_date:
        kwargs["end_date"] = str(end_date)

    logger.info("Fetching %s from %s (start=%s, end=%s)", symbol, provider, start_date, end_date)

    try:
        result = obb.equity.price.historical(**kwargs)
        df = result.to_df()
    except Exception as e:
        raise FetchError(f"Failed to fetch {symbol}: {e}") from e

    if df.empty:
        logger.warning("No data returned for %s", symbol)
        return pd.DataFrame(columns=_CANONICAL_COLUMNS)

    df = _normalize(df)

    logger.info("Fetched %d rows for %s", len(df), symbol)
    return df


def fetch_multiple(
    symbols: list[str],
    start_date: str | date | None = None,
    end_date: str | date | None = None,
    provider: str = "yfinance",
) -> dict[str, pd.DataFrame]:
    """Fetch historical data for multiple symbols with rate limiting."""
    results: dict[str, pd.DataFrame] = {}
    for i, symbol in enumerate(symbols):
        if i > 0:
            time.sleep(_RATE_LIMIT_DELAY)
        try:
            results[symbol] = fetch_historical(symbol, start_date, end_date, provider)
        except FetchError:
            logger.exception("Skipping %s due to fetch error", symbol)
            results[symbol] = pd.DataFrame(columns=_CANONICAL_COLUMNS)
    return results


def _normalize(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize OpenBB output to canonical schema."""
    df = df.copy()

    if df.index.name == "date" or "date" not in df.columns:
        df = df.reset_index()

    rename_map = {}
    for col in df.columns:
        lower = col.lower().replace(" ", "_")
        if lower != col:
            rename_map[col] = lower
    if rename_map:
        df = df.rename(columns=rename_map)

    for col in _CANONICAL_COLUMNS:
        if col not in df.columns:
            df[col] = None

    df["date"] = pd.to_datetime(df["date"]).dt.date
    df["volume"] = pd.to_numeric(df["volume"], errors="coerce").fillna(0).astype("int64")

    for col in ("open", "high", "low", "close", "vwap", "split_ratio", "dividend"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    return df[_CANONICAL_COLUMNS].copy()
