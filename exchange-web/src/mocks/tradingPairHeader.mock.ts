import type { TradingPairHeaderMarketSnapshot } from '@/types/tradingPairHeader'

/** 现货页演示 / Story 用 */
export function mockSpotHeaderTicker(): TradingPairHeaderMarketSnapshot {
  return {
    lastPrice: 67_380.12,
    changePct24h: -0.82,
    changeQuote24h: -558.3,
    high24h: 68_900,
    low24h: 66_200,
    volume24hBase: 12_400,
    quoteVolume24h: 820_000_000,
  }
}

/** 合约页演示 */
export function mockFuturesHeaderTicker(): TradingPairHeaderMarketSnapshot {
  const t = new Date(Date.now() + 2 * 3600_000 + 15 * 60_000).toISOString()
  return {
    lastPrice: 67_350,
    changePct24h: 1.05,
    changeQuote24h: 700,
    high24h: 68_000,
    low24h: 66_800,
    volume24hBase: 98_000,
    quoteVolume24h: 6.5e9,
    markPrice: 67_382.5,
    indexPrice: 67_410,
    fundingRate: 0.000087,
    nextFundingTime: t,
  }
}
