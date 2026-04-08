/**
 * Binance 现货公开接口（无需 API Key）
 * 开发环境经 Vite 代理 `/binance-api` 规避浏览器 CORS；生产构建直连 api.binance.com（若被 CORS 拦截需自行配置网关代理）。
 */

export const BINANCE_REST_BASE = import.meta.env.DEV ? '/binance-api' : 'https://api.binance.com'

const KLINES_PATH = '/api/v3/klines'

export type BinanceKlineInterval = '1m' | '5m' | '1h' | '1d'

export interface ParsedKlineBar {
  /** 开盘时间 ms */
  timestamp: number
  /** K 线起始时间（秒），用于 lightweight-charts */
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Binance REST 原始行：array of primitives */
export function parseKlineRestRow(row: unknown[]): ParsedKlineBar {
  const t = Number(row[0])
  return {
    timestamp: t,
    time: Math.floor(t / 1000),
    open: parseFloat(String(row[1])),
    high: parseFloat(String(row[2])),
    low: parseFloat(String(row[3])),
    close: parseFloat(String(row[4])),
    volume: parseFloat(String(row[5])),
  }
}

export interface FetchKlinesParams {
  symbol: string
  /** 币安 interval：1m 3m 5m 15m 30m 1h 2h 4h 6h 8h 12h 1d 等 */
  interval: BinanceKlineInterval | string
  /** 最大 1000 */
  limit: number
}

/**
 * 获取历史 K 线；失败时最多重试 3 次，间隔 1s。
 */
export async function fetchKlinesWithRetry(params: FetchKlinesParams): Promise<ParsedKlineBar[]> {
  const { symbol, interval, limit } = params
  const url = new URL(`${BINANCE_REST_BASE}${KLINES_PATH}`)
  url.searchParams.set('symbol', symbol.toUpperCase())
  url.searchParams.set('interval', interval)
  url.searchParams.set('limit', String(Math.min(1000, Math.max(1, limit))))

  let lastErr: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url.toString(), { method: 'GET' })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`)
      }
      const raw = (await res.json()) as unknown[][]
      return raw.map((row) => parseKlineRestRow(row))
    } catch (e) {
      lastErr = e
      if (attempt < 2) await sleep(1000)
    }
  }
  throw lastErr
}

/** 构建单路 K 线流 URL（小写 symbol） */
export function binanceKlineWsPath(symbol: string, interval: BinanceKlineInterval): string {
  const sym = symbol.replace(/[^A-Za-z0-9]/g, '').toLowerCase()
  return `${sym}@kline_${interval}`
}
