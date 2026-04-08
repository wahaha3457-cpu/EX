import type { ConvertFlashQuote } from '@/types/convertFlash'

/** 参考 USDT 价（演示，可接行情 mid） */
export const CONVERT_REFERENCE_USDT: Record<string, number> = {
  USDT: 1,
  BTC: 98_520,
  ETH: 3_428,
  BNB: 652,
  SOL: 148.2,
  XRP: 2.18,
}

export const CONVERT_FEE_PCT = 0.001

export const MIN_CONVERT_USDT_EQ = 5

/** 支持闪兑的币种（顺序即默认展示顺序） */
export const CONVERT_ASSET_ORDER = ['USDT', 'BTC', 'ETH', 'BNB', 'SOL', 'XRP'] as const

export type ConvertAssetSymbol = (typeof CONVERT_ASSET_ORDER)[number]

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function priceInUsdt(asset: string, ref: Record<string, number>): number {
  return ref[asset] ?? 0
}

/** 将 amountFrom 的 from 换为 to；经 USDT 桥；输出侧已扣演示手续费 */
export function computeConvertQuote(
  from: string,
  to: string,
  amountFrom: number,
  ref: Record<string, number>,
  feePct = CONVERT_FEE_PCT,
): Omit<ConvertFlashQuote, 'generatedAt' | 'expiresAt'> | null {
  if (amountFrom <= 0 || from === to) return null
  const pf = priceInUsdt(from, ref)
  const pt = priceInUsdt(to, ref)
  if (pf <= 0 || pt <= 0) return null
  const usdt = from === 'USDT' ? amountFrom : amountFrom * pf
  const rawOut = to === 'USDT' ? usdt : usdt / pt
  const amountToBeforeFee = rawOut
  const amountTo = rawOut * (1 - feePct)
  const rateFromTo = amountTo / amountFrom
  return {
    from,
    to,
    amountFrom,
    amountTo,
    amountToBeforeFee,
    feePct,
    rateFromTo,
  }
}

export function usdtEquivalent(asset: string, amount: number, ref: Record<string, number>): number {
  if (amount <= 0) return 0
  return asset === 'USDT' ? amount : amount * priceInUsdt(asset, ref)
}

/** 模拟网络报价延迟 */
export async function fetchConvertQuotePreview(
  from: string,
  to: string,
  amountFrom: number,
  ref: Record<string, number>,
  ttlMs = 10_000,
): Promise<ConvertFlashQuote | null> {
  await delay(80)
  const base = computeConvertQuote(from, to, amountFrom, ref)
  if (!base) return null
  const now = Date.now()
  return {
    ...base,
    generatedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttlMs).toISOString(),
  }
}
