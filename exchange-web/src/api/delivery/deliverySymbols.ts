/** 演示用交割合约代码：{标的}USDT_YYMMDD（后缀仅作代码区分；交割时刻由演示轮转逻辑计算） */
export const DELIVERY_DEFAULT_SYMBOL = 'BTCUSDT_250627'

/** 演示玩法：同标的下相邻「期」的交割刻度间隔（毫秒），生产可改为真实日历 */
export const DELIVERY_DEMO_STAGGER_MS = 60_000

export const DELIVERY_QUICK_SYMBOLS = [
  'BTCUSDT_250627',
  'BTCUSDT_250926',
  'ETHUSDT_250627',
  'ETHUSDT_250926',
  'SOLUSDT_250627',
  'SOLUSDT_250926',
] as const

export function normalizeDeliverySymbol(raw: string | undefined): string {
  const s = (raw || '').trim()
  if (!s) return DELIVERY_DEFAULT_SYMBOL
  if (DELIVERY_QUICK_SYMBOLS.includes(s as (typeof DELIVERY_QUICK_SYMBOLS)[number])) return s
  const m10 = s.match(/^([A-Z0-9]+)USDT_(\d{10})$/i)
  if (m10) {
    const yymmdd = m10[2].slice(0, 6)
    const candidate = `${m10[1].toUpperCase()}USDT_${yymmdd}`
    if (DELIVERY_QUICK_SYMBOLS.includes(candidate as (typeof DELIVERY_QUICK_SYMBOLS)[number])) return candidate
  }
  const m = s.match(/^([A-Z0-9]+)USDT_(\d{6})$/i)
  if (m) return `${m[1].toUpperCase()}USDT_${m[2]}`
  return DELIVERY_DEFAULT_SYMBOL
}

/**
 * 解析 YYMMDD → UTC 交割时刻（演示：当日 08:00 UTC，贴近部分所 16:00 UTC+8）
 */
export function deliveryIsoFromSuffix(yymmdd: string): string {
  const yy = parseInt(yymmdd.slice(0, 2), 10)
  const mm = parseInt(yymmdd.slice(2, 4), 10)
  const dd = parseInt(yymmdd.slice(4, 6), 10)
  const year = 2000 + yy
  return new Date(Date.UTC(year, mm - 1, dd, 8, 0, 0)).toISOString()
}

export function cycleLabelFromSuffix(yymmdd: string): string {
  const mm = yymmdd.slice(2, 4)
  const dd = yymmdd.slice(4, 6)
  return `${mm}/${dd} 交割`
}

export function compactUnderlying(symbol: string): string {
  return symbol.replace(/_\d{6,10}$/, '').toUpperCase() || 'BTCUSDT'
}

/** 交割期号展示：UTC 的 YYMMDDHHmm（10 位），与 ISO 交割时刻对齐 */
export function deliveryPeriodDigitsUtc(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '0000000000'
  const yy = d.getUTCFullYear() % 100
  const mm = d.getUTCMonth() + 1
  const dd = d.getUTCDate()
  const hh = d.getUTCHours()
  const min = d.getUTCMinutes()
  const p2 = (n: number) => String(n).padStart(2, '0')
  return `${p2(yy)}${p2(mm)}${p2(dd)}${p2(hh)}${p2(min)}`
}

/** 展示用合约码：{标的}USDT_YYMMDDHHmm（路由仍为 6 位 canonical） */
export function buildDeliveryDisplaySymbol(canonicalSymbol: string, deliveryAtIso: string): string {
  const u = compactUnderlying(canonicalSymbol)
  return `${u}_${deliveryPeriodDigitsUtc(deliveryAtIso)}`
}

/**
 * 持仓列表用：由「本期结束」时刻（与 {@link orderableSlotDeliveryEndMs} 一致）反推档起点，生成 BTCUSDT_YYMMDDHHmm。
 */
export function buildDeliveryContractCodeFromSettleEndMs(
  canonicalSymbol: string,
  deliverySettlesAtMs: number,
): string {
  if (!Number.isFinite(deliverySettlesAtMs)) {
    return compactUnderlying(canonicalSymbol)
  }
  const slotStartMs = deliverySettlesAtMs - DELIVERY_DEMO_STAGGER_MS
  if (!Number.isFinite(slotStartMs) || slotStartMs <= 0) {
    return compactUnderlying(canonicalSymbol)
  }
  return buildDeliveryDisplaySymbol(canonicalSymbol, new Date(slotStartMs).toISOString())
}
