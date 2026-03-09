from datetime import date

from fastapi import APIRouter, BackgroundTasks, HTTPException

from flow.ingestion.pipeline import (
    add_ticker,
    backfill,
    ingest_all,
    load_ticker_registry,
    remove_ticker,
)
from flow.models import (
    IngestResponse,
    IngestResult,
    OHLCVRow,
    PriceResponse,
    SummaryResponse,
    TickerAddRequest,
    TickerResponse,
)
from flow.storage.duckdb import query_prices, query_summary

router = APIRouter()


@router.get("/tickers", response_model=list[TickerResponse])
def list_tickers():
    registry = load_ticker_registry()
    return [
        TickerResponse(symbol=symbol, info=info)
        for symbol, info in sorted(registry.items())
    ]


@router.post("/tickers", response_model=TickerResponse, status_code=201)
def create_ticker(req: TickerAddRequest, bg: BackgroundTasks):
    symbol = req.symbol.upper()
    info = add_ticker(symbol)
    bg.add_task(backfill, symbol)
    return TickerResponse(symbol=symbol, info=info)


@router.delete("/tickers/{symbol}", status_code=204)
def delete_ticker(symbol: str):
    if not remove_ticker(symbol.upper()):
        raise HTTPException(404, detail=f"Ticker {symbol.upper()} not found")


@router.get("/equity/{symbol}/prices", response_model=PriceResponse)
def get_prices(
    symbol: str,
    start: date | None = None,
    end: date | None = None,
):
    symbol = symbol.upper()
    df = query_prices(symbol, start, end)
    rows = [OHLCVRow(**row) for row in df.to_dict("records")]
    return PriceResponse(symbol=symbol, count=len(rows), data=rows)


@router.get("/equity/{symbol}/summary", response_model=SummaryResponse)
def get_summary(symbol: str):
    symbol = symbol.upper()
    stats = query_summary(symbol)
    return SummaryResponse(symbol=symbol, **stats)


@router.post("/ingest", response_model=IngestResponse)
def trigger_ingest():
    results = ingest_all()
    return IngestResponse(results=results)
