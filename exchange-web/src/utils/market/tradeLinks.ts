import type { MarketTickerRow } from '@/types/market'

/**
 * 解析「现货 / U 本位合约」跳转参数。
 * USDT 市场：现货 BASE_USDT，合约 BASEUSDT。
 * 非 USDT 现货（如 ETH/BTC）：现货保持本对；合约跳到同基础资产的 U 本位主合约（演示规则）。
 */
export function resolveMarketTradeLinks(row: MarketTickerRow): {
  spotSymbol: string
  contractSymbol: string
} {
  if (row.kind === 'DELIVERY') {
    const base = row.baseAsset
    return {
      spotSymbol: `${base}_USDT`,
      contractSymbol: `${base}USDT`,
    }
  }
  const base = row.baseAsset
  if (row.quoteAsset === 'USDT') {
    return {
      spotSymbol: `${base}_USDT`,
      contractSymbol: `${base}USDT`,
    }
  }
  return {
    spotSymbol: row.kind === 'SPOT' ? row.routeSymbol : `${base}_USDT`,
    contractSymbol: `${base}USDT`,
  }
}
