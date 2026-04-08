import {
  DELIVERY_DEMO_STAGGER_MS,
  DELIVERY_QUICK_SYMBOLS,
  compactUnderlying,
} from '@/api/delivery/deliverySymbols'

/** 同一标的（如 BTCUSDT）下的可选交割期；顺序与 {@link DELIVERY_QUICK_SYMBOLS} 一致 */
export interface DeliverySiblingPeriod {
  symbol: string
  cycleLabel: string
}

export function deliverySiblingsForCompact(underlyingCompact: string): DeliverySiblingPeriod[] {
  const u = underlyingCompact.toUpperCase()
  const rows: DeliverySiblingPeriod[] = []
  for (const symbol of DELIVERY_QUICK_SYMBOLS) {
    if (compactUnderlying(symbol).toUpperCase() !== u) continue
    rows.push({
      symbol,
      cycleLabel: `第${rows.length + 1}期`,
    })
  }
  return rows
}

/**
 * 演示轮转：n 期共用一条时间轴，相邻两期相差 {@link DELIVERY_DEMO_STAGGER_MS}，
 * 整轮长度为 n×间隔；永远返回「当前时刻之后」的下一档交割 ISO。
 */
export function computeRollingDemoDeliveryAt(symbol: string, nowMs: number): string {
  const sibs = deliverySiblingsForCompact(compactUnderlying(symbol))
  const n = Math.max(1, sibs.length)
  const idx = Math.max(0, sibs.findIndex((s) => s.symbol === symbol))
  const STEP = DELIVERY_DEMO_STAGGER_MS
  let t = Math.ceil(nowMs / STEP) * STEP + idx * STEP
  while (t <= nowMs) {
    t += n * STEP
  }
  return new Date(t).toISOString()
}

export function deliveryDemoCycleLabel(symbol: string): string {
  const sibs = deliverySiblingsForCompact(compactUnderlying(symbol))
  const idx = Math.max(0, sibs.findIndex((s) => s.symbol === symbol))
  return `第${idx + 1}期`
}

/** 最近可交割档（按时间升序，去重） */
export interface DeliveryUpcomingSlot {
  deliveryAtIso: string
  deliveryAtMs: number
  /** 该档对应的合约代码（路由 symbol） */
  symbol: string
  phaseIndex: number
  /** 展示：最近第1档… */
  label: string
}

/**
 * 合并各相位下一系列交割时刻，取最近的 `count` 档（演示：每相位间隔 n×STEP 的下一轮）。
 */
export function computeUpcomingDeliverySlots(
  underlyingCompact: string,
  nowMs: number,
  count: number,
): DeliveryUpcomingSlot[] {
  const sibs = deliverySiblingsForCompact(underlyingCompact)
  const n = Math.max(1, sibs.length)
  const STEP = DELIVERY_DEMO_STAGGER_MS

  const candidates: { ms: number; phaseIndex: number; symbol: string }[] = []
  for (let idx = 0; idx < n; idx++) {
    const sym = sibs[idx].symbol
    const ms0 = new Date(computeRollingDemoDeliveryAt(sym, nowMs)).getTime()
    for (let k = 0; k < count; k++) {
      candidates.push({ ms: ms0 + k * n * STEP, phaseIndex: idx, symbol: sym })
    }
  }

  candidates.sort((a, b) => a.ms - b.ms)
  const seen = new Set<number>()
  const merged: typeof candidates = []
  for (const c of candidates) {
    if (seen.has(c.ms)) continue
    seen.add(c.ms)
    merged.push(c)
    if (merged.length >= count) break
  }

  return merged.slice(0, count).map((x, i) => ({
    deliveryAtIso: new Date(x.ms).toISOString(),
    deliveryAtMs: x.ms,
    symbol: x.symbol,
    phaseIndex: x.phaseIndex,
    label: `最近第${i + 1}档`,
  }))
}

/** 距交割剩余整秒（可为负，表示已过期） */
export function secondsUntilDelivery(iso: string, nowMs: number): number {
  const end = new Date(iso).getTime()
  if (Number.isNaN(end)) return 0
  return Math.floor((end - nowMs) / 1000)
}

/**
 * 演示「一分钟一期」：按 UTC 自然分钟对齐的当前分钟起点（毫秒）。
 * 与 {@link DELIVERY_DEMO_STAGGER_MS} 一致时为 60s 一期。
 */
export function currentUtcMinuteStartMs(nowMs: number): number {
  return Math.floor(nowMs / DELIVERY_DEMO_STAGGER_MS) * DELIVERY_DEMO_STAGGER_MS
}

export function nextUtcMinuteStartMs(nowMs: number): number {
  return currentUtcMinuteStartMs(nowMs) + DELIVERY_DEMO_STAGGER_MS
}

/** 距离当前 UTC 自然分钟结束剩余整秒（0..60），本期倒计时从满 60s 递减 */
export function secondsUntilEndOfUtcMinute(nowMs: number): number {
  const end = nextUtcMinuteStartMs(nowMs)
  return Math.max(0, Math.floor((end - nowMs) / 1000))
}

/** 距某一「演示分钟档」结束剩余整秒（档起点由 {@link currentUtcMinuteStartMs} + 偏移×间隔 得到） */
export function secondsUntilUtcSlotEnd(nowMs: number, slotStartMs: number): number {
  const end = slotStartMs + DELIVERY_DEMO_STAGGER_MS
  return Math.max(0, Math.floor((end - nowMs) / 1000))
}

/**
 * 与 {@link DeliveryOrderForm} 选中「档位期数」一致：该档本期结束时刻（= slotStart + STEP）。
 * 写入持仓 {@link FuturesPositionRow.deliverySettlesAtMs} 后，列表交割倒计时与下单区一致。
 */
export function orderableSlotDeliveryEndMs(nowMs: number, slotOffset: number): number {
  const off = Math.min(9, Math.max(0, Math.round(slotOffset)))
  const slotStart = currentUtcMinuteStartMs(nowMs) + off * DELIVERY_DEMO_STAGGER_MS
  return slotStart + DELIVERY_DEMO_STAGGER_MS
}

/** 距当前可选档「本轮结束」剩余整秒（与顶栏 / 下单区倒计时一致） */
export function secondsRemainingInCurrentOrderableRound(nowMs: number, slotOffset: number): number {
  const endMs = orderableSlotDeliveryEndMs(nowMs, slotOffset)
  return Math.max(0, Math.floor((endMs - nowMs) / 1000))
}

/**
 * 本轮结束前若干秒内禁止新下单（演示风控；生产可对齐真实截单时间）
 */
export const DELIVERY_ORDER_BLOCK_LAST_SECONDS = 10

/** 本期倒计时 HH:MM:SS（不足 1 小时同样补零） */
export function formatDeliveryCountdownHms(leftSec: number): string {
  const left = Math.max(0, leftSec)
  const h = Math.floor(left / 3600)
  const m = Math.floor((left % 3600) / 60)
  const s = left % 60
  const p2 = (n: number) => String(n).padStart(2, '0')
  return `${p2(h)}:${p2(m)}:${p2(s)}`
}

/**
 * 演示：当前合约（canonical symbol）的下一档交割 ISO（与 {@link computeRollingDemoDeliveryAt} 同轴，间隔 n×STEP）。
 */
export function computeNextDemoDeliveryIsoForSymbol(
  canonicalSymbol: string,
  currentDeliveryIso: string,
): string | null {
  const curMs = new Date(currentDeliveryIso).getTime()
  if (Number.isNaN(curMs)) return null
  const sibs = deliverySiblingsForCompact(compactUnderlying(canonicalSymbol))
  const n = Math.max(1, sibs.length)
  const nextMs = curMs + n * DELIVERY_DEMO_STAGGER_MS
  return new Date(nextMs).toISOString()
}

/** 倒计时展示；1 小时内用 M:SS，便于 1 分钟轮转演示 */
export function formatDeliveryCountdownFromSeconds(leftSec: number): string {
  let left = Math.max(0, leftSec)
  if (left < 3600) {
    const m = Math.floor(left / 60)
    const s = left % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }
  const d = Math.floor(left / 86400)
  left %= 86400
  const h = Math.floor(left / 3600)
  left %= 3600
  const m = Math.floor(left / 60)
  const s = left % 60
  if (d > 0) {
    return `${d}天 ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
