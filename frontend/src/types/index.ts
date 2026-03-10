export interface OHLCVRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap: number;
  split_ratio: number;
  dividend: number;
}

export interface TickerInfo {
  added: string;
  last_ingested: string | null;
}

export interface TickerResponse {
  symbol: string;
  info: TickerInfo;
}

export interface PriceResponse {
  symbol: string;
  count: number;
  data: OHLCVRow[];
}

export interface SummaryResponse {
  symbol: string;
  latest_date: string;
  latest_close: number;
  high_52w: number;
  low_52w: number;
  avg_volume_30d: number;
  total_rows: number;
}

export interface IngestResult {
  symbol: string;
  rows_fetched: number;
  rows_written: number;
  status: string;
}

export interface IngestResponse {
  results: IngestResult[];
}

export interface IndicatorConfig {
  type: 'sma' | 'ema' | 'rsi' | 'macd' | 'bollinger';
  params: Record<string, number>;
  enabled: boolean;
  color?: string;
}
