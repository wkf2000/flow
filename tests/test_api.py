from unittest.mock import patch

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from flow.api.app import app


@pytest.fixture
def client():
    return TestClient(app)


class TestTickerEndpoints:
    def test_list_tickers_empty(self, client: TestClient):
        with patch("flow.api.routes.equity.load_ticker_registry", return_value={}):
            resp = client.get("/api/tickers")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_add_ticker(self, client: TestClient):
        from flow.models import TickerInfo
        from datetime import date

        mock_info = TickerInfo(added=date(2025, 6, 1))
        with (
            patch("flow.api.routes.equity.add_ticker", return_value=mock_info),
            patch("flow.api.routes.equity.backfill"),
        ):
            resp = client.post("/api/tickers", json={"symbol": "AAPL"})
        assert resp.status_code == 201
        data = resp.json()
        assert data["symbol"] == "AAPL"

    def test_delete_ticker_not_found(self, client: TestClient):
        with patch("flow.api.routes.equity.remove_ticker", return_value=False):
            resp = client.delete("/api/tickers/ZZZZ")
        assert resp.status_code == 404


class TestPriceEndpoints:
    def test_get_prices(self, client: TestClient):
        mock_df = pd.DataFrame({
            "date": pd.to_datetime(["2025-06-01"]).date,
            "open": [100.0], "high": [105.0], "low": [95.0],
            "close": [102.0], "volume": [1000],
            "vwap": [101.0], "split_ratio": [1.0], "dividend": [0.0],
        })
        with patch("flow.api.routes.equity.query_prices", return_value=mock_df):
            resp = client.get("/api/equity/AAPL/prices")
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "AAPL"
        assert data["count"] == 1

    def test_get_summary(self, client: TestClient):
        mock_summary = {
            "latest_date": "2025-06-01",
            "latest_close": 102.0,
            "high_52w": 110.0,
            "low_52w": 90.0,
            "avg_volume_30d": 1500.0,
            "total_rows": 100,
        }
        with patch("flow.api.routes.equity.query_summary", return_value=mock_summary):
            resp = client.get("/api/equity/AAPL/summary")
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "AAPL"
        assert data["total_rows"] == 100
