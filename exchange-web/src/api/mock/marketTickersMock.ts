import type { MarketTickerRow } from '@/types/market'

function spot(
  base: string,
  quote: string,
  last: number,
  pct: number,
  volB: number,
  qVol: number,
  zone?: MarketTickerRow['zone'],
): MarketTickerRow {
  const routeSymbol = `${base}_${quote}`
  return {
    id: `SPOT:${routeSymbol}`,
    kind: 'SPOT',
    displayPair: `${base}/${quote}`,
    routeSymbol,
    baseAsset: base,
    quoteAsset: quote,
    lastPrice: last,
    changePct: pct,
    high24h: last * (1 + Math.abs(pct) / 100 * 0.4),
    low24h: last * (1 - Math.abs(pct) / 100 * 0.5),
    volumeBase: volB,
    quoteVolume: qVol,
    marketCapUsdt: Math.max(qVol * 240, 1e6),
    zone,
  }
}

function contract(
  base: string,
  quote: string,
  last: number,
  pct: number,
  volB: number,
  qVol: number,
  zone?: MarketTickerRow['zone'],
): MarketTickerRow {
  const routeSymbol = `${base}${quote}`
  return {
    id: `CONTRACT:${routeSymbol}`,
    kind: 'CONTRACT',
    displayPair: `${base}/${quote} 永续`,
    routeSymbol,
    baseAsset: base,
    quoteAsset: quote,
    lastPrice: last,
    changePct: pct,
    high24h: last * (1 + Math.abs(pct) / 100 * 0.35),
    low24h: last * (1 - Math.abs(pct) / 100 * 0.45),
    volumeBase: volB,
    quoteVolume: qVol,
    marketCapUsdt: Math.max(qVol * 240, 1e6),
    zone,
  }
}

/** 演示数据：覆盖多分类、分区与涨跌分布 */
export function getMarketTickersMock(): MarketTickerRow[] {
  return [
    spot('BTC', 'USDT', 68420.5, 1.82, 12800, 8.72e8, 'MAIN'),
    spot('ETH', 'USDT', 3512.08, -0.45, 980000, 3.21e8, 'MAIN'),
    spot('SOL', 'USDT', 178.32, 3.21, 4200000, 6.5e7, 'HOT'),
    spot('BNB', 'USDT', 612.45, 0.12, 890000, 4.8e7, 'MAIN'),
    spot('XRP', 'USDT', 0.6234, -1.05, 1.2e9, 6.2e7, 'INNOVATION'),
    spot('DOGE', 'USDT', 0.1842, 2.67, 8.5e9, 1.1e8, 'HOT'),
    spot('ADA', 'USDT', 0.512, -0.88, 4.2e9, 2.0e7, 'INNOVATION'),
    spot('AVAX', 'USDT', 36.12, 1.05, 1200000, 3.8e7, 'MAIN'),
    spot('LINK', 'USDT', 18.44, -0.32, 5600000, 9.5e7, 'MAIN'),
    spot('DOT', 'USDT', 7.22, 0.65, 21000000, 1.35e8, 'MAIN'),
    spot('LTC', 'USDT', 82.15, -4.2, 980000, 7.8e7, 'MAIN'),
    spot('BCH', 'USDT', 412.3, -3.1, 420000, 1.65e8, 'MAIN'),
    spot('ETH', 'BTC', 0.0513, 0.22, 12800, 620, 'MAIN'),
    spot('BNB', 'BTC', 0.00894, -0.15, 56000, 480, 'MAIN'),
    spot('SOL', 'BTC', 0.00261, 0.55, 120000, 310, 'MAIN'),
    contract('BTC', 'USDT', 68380.0, 1.79, 9200000, 5.9e9, 'MAIN'),
    contract('ETH', 'USDT', 3508.2, -0.48, 48e6, 1.55e9, 'MAIN'),
    contract('SOL', 'USDT', 177.9, 3.15, 62e6, 9.8e8, 'HOT'),
    contract('WIF', 'USDT', 2.845, 12.1, 410e6, 1.05e9, 'INNOVATION'),
    contract('PEPE', 'USDT', 0.00001234, 18.4, 8200e9, 9.2e8, 'INNOVATION'),
  ]
}
