from datetime import date
from pathlib import Path

import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

from flow.config import Settings, settings as default_settings

OHLCV_SCHEMA = pa.schema([
    ("date", pa.date32()),
    ("open", pa.float64()),
    ("high", pa.float64()),
    ("low", pa.float64()),
    ("close", pa.float64()),
    ("volume", pa.int64()),
    ("vwap", pa.float64()),
    ("split_ratio", pa.float64()),
    ("dividend", pa.float64()),
])


def _partition_dir(
    ticker: str,
    year: int,
    provider: str = "yfinance",
    *,
    settings: Settings | None = None,
) -> Path:
    s = settings or default_settings
    return s.equity_prices_dir / f"provider={provider}" / f"ticker={ticker}" / f"year={year}"


def write_ohlcv(
    df: pd.DataFrame,
    ticker: str,
    provider: str = "yfinance",
    *,
    settings: Settings | None = None,
) -> int:
    """Write OHLCV data to hive-partitioned parquet files.

    Merges with existing data and deduplicates on date.
    Returns total rows written across all year partitions.
    """
    if df.empty:
        return 0

    df = df.copy()
    df["date"] = pd.to_datetime(df["date"]).dt.date

    for col in ("vwap", "split_ratio", "dividend"):
        if col not in df.columns:
            df[col] = None

    total_written = 0
    years = {d.year for d in df["date"]}

    for year in sorted(years):
        year_df = df[df["date"].apply(lambda d: d.year == year)]
        part_dir = _partition_dir(ticker, year, provider, settings=settings)

        existing = _read_partition(part_dir)
        if existing is not None:
            merged = pd.concat([existing, year_df], ignore_index=True)
        else:
            merged = year_df

        merged["date"] = pd.to_datetime(merged["date"]).dt.date
        merged = merged.drop_duplicates(subset=["date"], keep="last")
        merged = merged.sort_values("date").reset_index(drop=True)

        _write_partition(merged, part_dir)
        total_written += len(merged)

    return total_written


def read_ohlcv(
    ticker: str,
    provider: str = "yfinance",
    start: date | None = None,
    end: date | None = None,
    *,
    settings: Settings | None = None,
) -> pd.DataFrame:
    """Read OHLCV data from hive-partitioned parquet files."""
    s = settings or default_settings
    ticker_dir = s.equity_prices_dir / f"provider={provider}" / f"ticker={ticker}"

    if not ticker_dir.exists():
        return pd.DataFrame(columns=["date", "open", "high", "low", "close", "volume", "vwap", "split_ratio", "dividend"])

    frames = []
    for year_dir in sorted(ticker_dir.iterdir()):
        if not year_dir.is_dir() or not year_dir.name.startswith("year="):
            continue
        part_df = _read_partition(year_dir)
        if part_df is not None:
            frames.append(part_df)

    if not frames:
        return pd.DataFrame(columns=["date", "open", "high", "low", "close", "volume", "vwap", "split_ratio", "dividend"])

    result = pd.concat(frames, ignore_index=True)
    result["date"] = pd.to_datetime(result["date"]).dt.date
    result = result.sort_values("date").reset_index(drop=True)

    if start:
        result = result[result["date"] >= start]
    if end:
        result = result[result["date"] <= end]

    return result.reset_index(drop=True)


def get_last_date(
    ticker: str,
    provider: str = "yfinance",
    *,
    settings: Settings | None = None,
) -> date | None:
    """Return the most recent date stored for a ticker, or None."""
    df = read_ohlcv(ticker, provider, settings=settings)
    if df.empty:
        return None
    return max(df["date"])


def _read_partition(part_dir: Path) -> pd.DataFrame | None:
    parquet_file = part_dir / "data.parquet"
    if not parquet_file.exists():
        return None
    table = pq.read_table(parquet_file)
    return table.to_pandas()


def _write_partition(df: pd.DataFrame, part_dir: Path) -> None:
    part_dir.mkdir(parents=True, exist_ok=True)
    parquet_file = part_dir / "data.parquet"

    write_df = df.copy()
    write_df["date"] = pd.to_datetime(write_df["date"])

    for col, expected in [("volume", "int64"), ("vwap", "float64"), ("split_ratio", "float64"), ("dividend", "float64")]:
        if col in write_df.columns:
            write_df[col] = pd.to_numeric(write_df[col], errors="coerce")

    write_df["volume"] = write_df["volume"].fillna(0).astype("int64")

    table = pa.Table.from_pandas(write_df, schema=OHLCV_SCHEMA, preserve_index=False)
    pq.write_table(table, parquet_file)
