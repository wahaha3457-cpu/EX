import type { MarketTickerRow } from '@/types/market'

/** 与 {@link useMarketStore} 自选 key 一致：`SPOT:BTC_USDT` / `CONTRACT:BTCUSDT` */
export function pairWatchKey(r: MarketTickerRow): string {
  return `${r.kind}:${r.routeSymbol}`
}
