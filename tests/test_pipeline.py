from datetime import date
from unittest.mock import patch

import pandas as pd
import pytest

from flow.config import Settings
from flow.ingestion.pipeline import (
    add_ticker,
    backfill,
    incremental_ingest,
    load_ticker_registry,
    remove_ticker,
    save_ticker_registry,
)
from flow.models import TickerInfo


def _mock_fetch_df(rows: int = 10, start_date: str = "2025-01-01"):
    dates = pd.date_range(start_date, periods=rows, freq="B")
    return pd.DataFrame({
        "date": dates,
        "open": [100.0] * rows,
        "high": [105.0] * rows,
        "low": [95.0] * rows,
        "close": [102.0] * rows,
        "volume": [1000] * rows,
        "vwap": [101.0] * rows,
        "split_ratio": [1.0] * rows,
        "dividend": [0.0] * rows,
    })


class TestTickerRegistry:
    def test_add_and_load(self, test_settings: Settings):
        info = add_ticker("AAPL", test_settings)
        assert info.added == date.today()
        assert info.last_ingested is None

        registry = load_ticker_registry(test_settings)
        assert "AAPL" in registry

    def test_add_idempotent(self, test_settings: Settings):
        add_ticker("AAPL", test_settings)
        add_ticker("AAPL", test_settings)
        registry = load_ticker_registry(test_settings)
        assert len(registry) == 1

    def test_add_uppercases(self, test_settings: Settings):
        add_ticker("aapl", test_settings)
        registry = load_ticker_registry(test_settings)
        assert "AAPL" in registry

    def test_remove(self, test_settings: Settings):
        add_ticker("AAPL", test_settings)
        assert remove_ticker("AAPL", test_settings) is True
        assert load_ticker_registry(test_settings) == {}

    def test_remove_missing_returns_false(self, test_settings: Settings):
        assert remove_ticker("MISSING", test_settings) is False

    def test_empty_registry(self, test_settings: Settings):
        assert load_ticker_registry(test_settings) == {}


class TestBackfill:
    @patch("flow.ingestion.pipeline.fetch_historical")
    def test_backfill_writes_data(self, mock_fetch, test_settings: Settings):
        mock_fetch.return_value = _mock_fetch_df(10)

        result = backfill("AAPL", test_settings)

        assert result.status == "ok"
        assert result.rows_fetched == 10
        assert result.rows_written == 10

        registry = load_ticker_registry(test_settings)
        assert registry["AAPL"].last_ingested == date.today()

    @patch("flow.ingestion.pipeline.fetch_historical")
    def test_backfill_auto_registers(self, mock_fetch, test_settings: Settings):
        mock_fetch.return_value = _mock_fetch_df(5)
        backfill("MSFT", test_settings)
        assert "MSFT" in load_ticker_registry(test_settings)


class TestIncrementalIngest:
    @patch("flow.ingestion.pipeline.fetch_historical")
    def test_falls_back_to_backfill_if_no_data(self, mock_fetch, test_settings: Settings):
        mock_fetch.return_value = _mock_fetch_df(5)
        add_ticker("AAPL", test_settings)

        result = incremental_ingest("AAPL", test_settings)
        assert result.status == "ok"
        assert result.rows_fetched == 5

    @patch("flow.ingestion.pipeline.fetch_historical")
    def test_incremental_after_backfill(self, mock_fetch, test_settings: Settings):
        mock_fetch.return_value = _mock_fetch_df(10, "2025-01-01")
        backfill("AAPL", test_settings)

        mock_fetch.return_value = _mock_fetch_df(3, "2025-01-13")
        result = incremental_ingest("AAPL", test_settings)
        assert result.status == "ok"
