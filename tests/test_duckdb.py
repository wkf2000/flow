from datetime import date

import pandas as pd
import pytest

from flow.config import Settings
from flow.storage.duckdb import list_available_tickers, query_prices, query_summary
from flow.storage.parquet import write_ohlcv


def _seed_data(settings: Settings, ticker: str = "AAPL", n: int = 30):
    dates = pd.date_range("2025-06-01", periods=n, freq="B")
    df = pd.DataFrame({
        "date": dates,
        "open": [100.0 + i for i in range(n)],
        "high": [105.0 + i for i in range(n)],
        "low": [95.0 + i for i in range(n)],
        "close": [102.0 + i for i in range(n)],
        "volume": [1000 * (i + 1) for i in range(n)],
        "vwap": [101.0 + i for i in range(n)],
        "split_ratio": [1.0] * n,
        "dividend": [0.0] * n,
    })
    write_ohlcv(df, ticker, settings=settings)
    return df


class TestQueryPrices:
    def test_returns_all_rows(self, test_settings: Settings):
        _seed_data(test_settings)
        result = query_prices("AAPL", settings=test_settings)
        assert len(result) == 30

    def test_date_filtering(self, test_settings: Settings):
        _seed_data(test_settings)
        result = query_prices(
            "AAPL",
            start=date(2025, 6, 10),
            end=date(2025, 6, 20),
            settings=test_settings,
        )
        assert len(result) > 0
        dates = pd.to_datetime(result["date"]).dt.date
        for d in dates:
            assert d >= date(2025, 6, 10)
            assert d <= date(2025, 6, 20)

    def test_missing_ticker_returns_empty(self, test_settings: Settings):
        _seed_data(test_settings)
        result = query_prices("ZZZZ", settings=test_settings)
        assert len(result) == 0


class TestQuerySummary:
    def test_summary_has_expected_fields(self, test_settings: Settings):
        _seed_data(test_settings)
        summary = query_summary("AAPL", settings=test_settings)
        assert summary["total_rows"] == 30
        assert summary["latest_date"] is not None
        assert summary["latest_close"] is not None

    def test_summary_missing_ticker(self, test_settings: Settings):
        _seed_data(test_settings, "AAPL")
        summary = query_summary("ZZZZ", settings=test_settings)
        assert summary["total_rows"] == 0


class TestListTickers:
    def test_lists_tickers_with_data(self, test_settings: Settings):
        _seed_data(test_settings, "AAPL")
        _seed_data(test_settings, "MSFT")
        tickers = list_available_tickers(settings=test_settings)
        assert "AAPL" in tickers
        assert "MSFT" in tickers

    def test_no_data_returns_empty(self, test_settings: Settings):
        tickers = list_available_tickers(settings=test_settings)
        assert tickers == []
