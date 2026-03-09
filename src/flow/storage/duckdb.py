from contextlib import contextmanager
from datetime import date
from pathlib import Path
from typing import Generator

import duckdb
import pandas as pd

from flow.config import Settings, settings as default_settings


@contextmanager
def get_connection(
    settings: Settings | None = None,
) -> Generator[duckdb.DuckDBPyConnection, None, None]:
    """In-memory DuckDB connection with views over parquet files."""
    s = settings or default_settings
    conn = duckdb.connect(":memory:")
    try:
        _create_views(conn, s)
        yield conn
    finally:
        conn.close()


def _create_views(conn: duckdb.DuckDBPyConnection, settings: Settings) -> None:
    parquet_glob = str(settings.equity_prices_dir / "**" / "*.parquet")
    conn.execute(f"""
        CREATE OR REPLACE VIEW equity_prices AS
        SELECT * FROM read_parquet('{parquet_glob}', hive_partitioning=true)
    """)


def query_prices(
    symbol: str,
    start: date | None = None,
    end: date | None = None,
    settings: Settings | None = None,
) -> pd.DataFrame:
    """Query OHLCV prices for a symbol via DuckDB."""
    s = settings or default_settings
    conditions = ["ticker = ?"]
    params: list = [symbol]

    if start:
        conditions.append("date >= ?")
        params.append(start)
    if end:
        conditions.append("date <= ?")
        params.append(end)

    where = " AND ".join(conditions)

    with get_connection(s) as conn:
        return conn.execute(
            f"""
            SELECT date, open, high, low, close, volume, vwap, split_ratio, dividend
            FROM equity_prices
            WHERE {where}
            ORDER BY date
            """,
            params,
        ).df()


def query_summary(
    symbol: str,
    settings: Settings | None = None,
) -> dict:
    """Compute summary statistics for a symbol."""
    s = settings or default_settings

    with get_connection(s) as conn:
        row = conn.execute(
            """
            SELECT
                MAX(date) AS latest_date,
                (SELECT close FROM equity_prices WHERE ticker = ? ORDER BY date DESC LIMIT 1) AS latest_close,
                MAX(high) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '52 weeks') AS high_52w,
                MIN(low) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '52 weeks') AS low_52w,
                AVG(volume) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '30 days') AS avg_volume_30d,
                COUNT(*) AS total_rows
            FROM equity_prices
            WHERE ticker = ?
            """,
            [symbol, symbol],
        ).fetchone()

    if row is None or row[5] == 0:
        return {
            "latest_date": None,
            "latest_close": None,
            "high_52w": None,
            "low_52w": None,
            "avg_volume_30d": None,
            "total_rows": 0,
        }

    return {
        "latest_date": row[0],
        "latest_close": row[1],
        "high_52w": row[2],
        "low_52w": row[3],
        "avg_volume_30d": row[4],
        "total_rows": row[5],
    }


def list_available_tickers(
    settings: Settings | None = None,
) -> list[str]:
    """List all tickers that have parquet data."""
    s = settings or default_settings
    parquet_glob = str(s.equity_prices_dir / "**" / "*.parquet")

    try:
        with get_connection(s) as conn:
            rows = conn.execute(
                f"""
                SELECT DISTINCT ticker
                FROM read_parquet('{parquet_glob}', hive_partitioning=true)
                ORDER BY ticker
                """
            ).fetchall()
            return [r[0] for r in rows]
    except duckdb.IOException:
        return []
