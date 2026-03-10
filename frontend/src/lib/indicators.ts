import { SMA, EMA, RSI, MACD, BollingerBands } from 'technicalindicators';

interface TimeValue {
  time: string;
  value: number;
}

export function computeSMA(closes: number[], dates: string[], period: number): TimeValue[] {
  const values = SMA.calculate({ period, values: closes });
  const offset = closes.length - values.length;
  return values.map((value, i) => ({ time: dates[i + offset], value }));
}

export function computeEMA(closes: number[], dates: string[], period: number): TimeValue[] {
  const values = EMA.calculate({ period, values: closes });
  const offset = closes.length - values.length;
  return values.map((value, i) => ({ time: dates[i + offset], value }));
}

export function computeRSI(closes: number[], dates: string[], period: number): TimeValue[] {
  const values = RSI.calculate({ period, values: closes });
  const offset = closes.length - values.length;
  return values.map((value, i) => ({ time: dates[i + offset], value }));
}

export function computeMACD(
  closes: number[],
  dates: string[],
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number
) {
  const results = MACD.calculate({
    values: closes,
    fastPeriod,
    slowPeriod,
    signalPeriod,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const offset = closes.length - results.length;
  return results.map((r, i) => ({
    time: dates[i + offset],
    macd: r.MACD ?? 0,
    signal: r.signal ?? 0,
    histogram: r.histogram ?? 0,
  }));
}

export function computeBollingerBands(
  closes: number[],
  dates: string[],
  period: number,
  stdDev: number
) {
  const results = BollingerBands.calculate({ period, values: closes, stdDev });
  const offset = closes.length - results.length;
  return results.map((r, i) => ({
    time: dates[i + offset],
    upper: r.upper,
    middle: r.middle,
    lower: r.lower,
  }));
}
