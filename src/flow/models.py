from datetime import date, datetime

from pydantic import BaseModel, Field


class OHLCVRow(BaseModel):
    date: date
    open: float | None = None
    high: float | None = None
    low: float | None = None
    close: float | None = None
    volume: int
    vwap: float | None = None
    split_ratio: float | None = None
    dividend: float | None = None


class TickerInfo(BaseModel):
    added: date
    last_ingested: date | None = None


class TickerAddRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=10, pattern=r"^[A-Z0-9.]+$")


class TickerResponse(BaseModel):
    symbol: str
    info: TickerInfo


class PriceQuery(BaseModel):
    start: date | None = None
    end: date | None = None


class PriceResponse(BaseModel):
    symbol: str
    count: int
    data: list[OHLCVRow]


class SummaryResponse(BaseModel):
    symbol: str
    latest_date: date | None = None
    latest_close: float | None = None
    high_52w: float | None = None
    low_52w: float | None = None
    avg_volume_30d: float | None = None
    total_rows: int = 0


class IngestResult(BaseModel):
    symbol: str
    rows_fetched: int
    rows_written: int
    status: str


class IngestResponse(BaseModel):
    results: list[IngestResult]
