from datetime import date

import pandas as pd
import pytest

from flow.config import Settings
from flow.storage.parquet import get_last_date, read_ohlcv, write_ohlcv


def _make_df(rows: list[dict]) -> pd.DataFrame:
    defaults = {"open": 100.0, "high": 105.0, "low": 95.0, "close": 102.0, "volume": 1000}
    return pd.DataFrame([{**defaults, **r} for r in rows])


class TestWriteOhlcv:
    def test_write_and_read_roundtrip(self, test_settings: Settings):
        df = _make_df([
            {"date": "2025-06-01"},
            {"date": "2025-06-02"},
        ])
        written = write_ohlcv(df, "AAPL", settings=test_settings)
        assert written == 2

        result = read_ohlcv("AAPL", settings=test_settings)
        assert len(result) == 2
        assert list(result["date"]) == [date(2025, 6, 1), date(2025, 6, 2)]

    def test_deduplication_keeps_latest(self, test_settings: Settings):
        df1 = _make_df([{"date": "2025-06-01", "close": 100.0}])
        write_ohlcv(df1, "AAPL", settings=test_settings)

        df2 = _make_df([{"date": "2025-06-01", "close": 105.0}])
        write_ohlcv(df2, "AAPL", settings=test_settings)

        result = read_ohlcv("AAPL", settings=test_settings)
        assert len(result) == 1
        assert result.iloc[0]["close"] == 105.0

    def test_multiple_years_partitioned(self, test_settings: Settings):
        df = _make_df([
            {"date": "2024-12-31"},
            {"date": "2025-01-01"},
        ])
        write_ohlcv(df, "AAPL", settings=test_settings)

        year_2024 = test_settings.equity_prices_dir / "provider=yfinance" / "ticker=AAPL" / "year=2024"
        year_2025 = test_settings.equity_prices_dir / "provider=yfinance" / "ticker=AAPL" / "year=2025"
        assert (year_2024 / "data.parquet").exists()
        assert (year_2025 / "data.parquet").exists()

    def test_write_empty_returns_zero(self, test_settings: Settings):
        df = pd.DataFrame(columns=["date", "open", "high", "low", "close", "volume"])
        assert write_ohlcv(df, "AAPL", settings=test_settings) == 0

    def test_date_filtering(self, test_settings: Settings):
        df = _make_df([
            {"date": "2025-06-01"},
            {"date": "2025-06-15"},
            {"date": "2025-06-30"},
        ])
        write_ohlcv(df, "AAPL", settings=test_settings)

        result = read_ohlcv("AAPL", start=date(2025, 6, 10), end=date(2025, 6, 20), settings=test_settings)
        assert len(result) == 1
        assert result.iloc[0]["date"] == date(2025, 6, 15)


class TestGetLastDate:
    def test_returns_none_for_missing_ticker(self, test_settings: Settings):
        assert get_last_date("MISSING", settings=test_settings) is None

    def test_returns_most_recent_date(self, test_settings: Settings):
        df = _make_df([
            {"date": "2025-06-01"},
            {"date": "2025-06-15"},
        ])
        write_ohlcv(df, "AAPL", settings=test_settings)
        assert get_last_date("AAPL", settings=test_settings) == date(2025, 6, 15)
