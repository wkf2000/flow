import logging

import typer

from flow.ingestion.pipeline import (
    add_ticker as _add_ticker,
    backfill as _backfill,
    ingest_all,
    load_ticker_registry,
    remove_ticker as _remove_ticker,
)

app = typer.Typer(name="flow", help="Stock market data ingestion and analysis CLI")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@app.command()
def add(symbol: str = typer.Argument(..., help="Ticker symbol to add (e.g. AAPL)")):
    """Register a new ticker for tracking."""
    symbol = symbol.upper()
    info = _add_ticker(symbol)
    typer.echo(f"Added {symbol} (registered {info.added})")


@app.command()
def remove(symbol: str = typer.Argument(..., help="Ticker symbol to remove")):
    """Remove a ticker from the registry."""
    symbol = symbol.upper()
    if _remove_ticker(symbol):
        typer.echo(f"Removed {symbol}")
    else:
        typer.echo(f"{symbol} not found in registry", err=True)
        raise typer.Exit(1)


@app.command(name="list")
def list_tickers():
    """List all registered tickers."""
    registry = load_ticker_registry()
    if not registry:
        typer.echo("No tickers registered. Use 'flow add <SYMBOL>' to add one.")
        return
    for symbol, info in sorted(registry.items()):
        last = info.last_ingested or "never"
        typer.echo(f"  {symbol:<8} added={info.added}  last_ingested={last}")


@app.command()
def backfill(
    symbol: str = typer.Argument(..., help="Ticker symbol to backfill"),
):
    """Run full historical backfill for a ticker."""
    symbol = symbol.upper()
    typer.echo(f"Starting backfill for {symbol}...")
    result = _backfill(symbol)
    typer.echo(f"  status={result.status}  fetched={result.rows_fetched}  written={result.rows_written}")


@app.command()
def ingest():
    """Run incremental ingestion for all registered tickers."""
    results = ingest_all()
    if not results:
        typer.echo("No tickers registered. Use 'flow add <SYMBOL>' first.")
        return
    for r in results:
        typer.echo(f"  {r.symbol:<8} status={r.status}  fetched={r.rows_fetched}  written={r.rows_written}")


@app.command()
def serve(
    host: str = typer.Option("127.0.0.1", help="Host to bind to"),
    port: int = typer.Option(8000, help="Port to listen on"),
    reload: bool = typer.Option(False, help="Enable auto-reload for development"),
):
    """Start the FastAPI server."""
    import uvicorn
    uvicorn.run("flow.api.app:app", host=host, port=port, reload=reload)


if __name__ == "__main__":
    app()
