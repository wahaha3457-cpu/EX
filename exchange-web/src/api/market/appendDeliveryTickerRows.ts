import type { MarketTickerRow } from '@/types/market'
import { DELIVERY_QUICK_SYMBOLS } from '@/api/delivery/deliverySymbols'

/**
 * 在统一行情列表末尾追加交割合约行（代码与 `DELIVERY_QUICK_SYMBOLS` 对齐；价格字段参考同标的永续）。
 * 列表已含 `kind === 'DELIVERY'` 时跳过。
 */
export function appendDeliveryTickerRows(rows: MarketTickerRow[]): MarketTickerRow[] {
  if (rows.some((r) => r.kind === 'DELIVERY')) return rows

  const refs = new Map(
    rows.filter((r) => r.kind === 'CONTRACT' && r.quoteAsset === 'USDT').map((r) => [r.baseAsset, r]),
  )

  const extra: MarketTickerRow[] = []

  for (const sym of DELIVERY_QUICK_SYMBOLS) {
    const m = /^([A-Z]+)USDT_(\d{6})$/i.exec(sym)
    if (!m) continue
    const base = m[1].toUpperCase()
    const dateSuffix = m[2]
    const ref = refs.get(base)
    const last = ref?.lastPrice ?? 1
    const pct = ref?.changePct ?? 0
    const volB = ref ? Math.max(ref.volumeBase * 0.06, 1) : 1e6
    const qVol = ref ? Math.max(ref.quoteVolume * 0.06, 1e6) : 1e7

    extra.push({
      id: `DELIVERY:${sym}`,
      kind: 'DELIVERY',
      displayPair: `${base}/USDT · 交割 ${dateSuffix}`,
      routeSymbol: sym,
      baseAsset: base,
      quoteAsset: 'USDT',
      lastPrice: last,
      changePct: pct,
      high24h: ref?.high24h ?? last * 1.02,
      low24h: ref?.low24h ?? last * 0.98,
      volumeBase: volB,
      quoteVolume: qVol,
      marketCapUsdt: Math.max(qVol * 240, 1e6),
      zone: ref?.zone,
    })
  }

  return [...rows, ...extra]
}
