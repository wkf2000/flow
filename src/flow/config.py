from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    data_dir: Path = Path("data")
    equity_prices_subdir: str = "equity_prices"
    default_provider: str = "yfinance"
    backfill_start_date: str = "2005-01-01"
    overlap_days: int = 5
    tickers_file: str = "tickers.json"
    api_key: str = ""

    @property
    def equity_prices_dir(self) -> Path:
        return self.data_dir / self.equity_prices_subdir

    @property
    def tickers_path(self) -> Path:
        return self.data_dir / self.tickers_file

    model_config = {"env_prefix": "FLOW_"}


settings = Settings()
