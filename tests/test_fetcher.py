from unittest.mock import MagicMock

import pandas as pd
import pytest

from flow.ingestion.fetcher import FetchError, fetch_historical


def _mock_obb_result(data: dict) -> MagicMock:
    mock_result = MagicMock()
    mock_result.to_df.return_value = pd.DataFrame(data)
    return mock_result


def _make_mock_obb(result=None, side_effect=None) -> MagicMock:
    mock_obb = MagicMock()
    if side_effect:
        mock_obb.equity.price.historical.side_effect = side_effect
    else:
        mock_obb.equity.price.historical.return_value = result
    return mock_obb


class TestFetchHistorical:
    def test_basic_fetch(self):
        mock_obb = _make_mock_obb(result=_mock_obb_result({
            "date": pd.to_datetime(["2025-06-01", "2025-06-02"]),
            "open": [100.0, 101.0],
            "high": [105.0, 106.0],
            "low": [95.0, 96.0],
            "close": [102.0, 103.0],
            "volume": [1000, 2000],
        }))

        df = fetch_historical("AAPL", _obb=mock_obb)

        mock_obb.equity.price.historical.assert_called_once_with(
            symbol="AAPL", provider="yfinance"
        )
        assert len(df) == 2
        assert list(df.columns) == [
            "date", "open", "high", "low", "close", "volume",
            "vwap", "split_ratio", "dividend",
        ]

    def test_passes_date_params(self):
        mock_obb = _make_mock_obb(result=_mock_obb_result({
            "date": pd.to_datetime(["2025-06-01"]),
            "open": [100.0], "high": [105.0], "low": [95.0],
            "close": [102.0], "volume": [1000],
        }))

        fetch_historical("AAPL", start_date="2025-01-01", end_date="2025-06-01", _obb=mock_obb)

        mock_obb.equity.price.historical.assert_called_once_with(
            symbol="AAPL", provider="yfinance",
            start_date="2025-01-01", end_date="2025-06-01",
        )

    def test_raises_fetch_error_on_failure(self):
        mock_obb = _make_mock_obb(side_effect=RuntimeError("API down"))

        with pytest.raises(FetchError, match="Failed to fetch AAPL"):
            fetch_historical("AAPL", _obb=mock_obb)

    def test_empty_result_returns_empty_df(self):
        mock_result = MagicMock()
        mock_result.to_df.return_value = pd.DataFrame()
        mock_obb = _make_mock_obb(result=mock_result)

        df = fetch_historical("AAPL", _obb=mock_obb)
        assert df.empty

    def test_normalizes_missing_columns(self):
        mock_obb = _make_mock_obb(result=_mock_obb_result({
            "date": pd.to_datetime(["2025-06-01"]),
            "open": [100.0], "high": [105.0], "low": [95.0],
            "close": [102.0], "volume": [1000],
        }))

        df = fetch_historical("AAPL", _obb=mock_obb)
        assert "vwap" in df.columns
        assert "split_ratio" in df.columns
        assert "dividend" in df.columns

    def test_normalizes_date_index(self):
        raw_df = pd.DataFrame({
            "open": [100.0], "high": [105.0], "low": [95.0],
            "close": [102.0], "volume": [1000],
        }, index=pd.DatetimeIndex(["2025-06-01"], name="date"))

        mock_result = MagicMock()
        mock_result.to_df.return_value = raw_df
        mock_obb = _make_mock_obb(result=mock_result)

        df = fetch_historical("AAPL", _obb=mock_obb)
        assert "date" in df.columns
        assert len(df) == 1
