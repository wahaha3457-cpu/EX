import { buildDeliveryContractCodeFromSettleEndMs } from '@/api/delivery/deliverySymbols'
import { formatOrderQty, formatPct, formatPrice, formatSignedQuote } from '@/utils/format/number'
import { formatPairSymbol, positionSideText } from '@/utils/order/orderDisplay'
import type { FuturesOrderType, FuturesPositionRow } from '@/types/futuresTrade'
import type { PositionPnlTone, PositionsTableRow } from '@/types/positionsTable'
import { formatDeliveryCountdownHms } from '@/composables/delivery/deliveryCycleUtils'

function pnlTone(n: number): PositionPnlTone {
  if (!Number.isFinite(n) || n === 0) return 'flat'
  return n > 0 ? 'gain' : 'loss'
}

function roiTone(pnl: number, roiPct: number | null): PositionPnlTone | 'muted' {
  if (roiPct == null || !Number.isFinite(roiPct)) return 'muted'
  if (Math.abs(roiPct) < 1e-8 && Math.abs(pnl) < 1e-8) return 'flat'
  return roiPct > 0 ? 'gain' : 'loss'
}

/**
 * 收益率：优先使用逐仓保证金为基准；全仓未分配保证金时无法展示，返回 null（显示 —）
 * 生产可接入「仓位占用保证金」字段替代 isolatedMargin
 */
function roiPercent(p: FuturesPositionRow): number | null {
  const m = p.isolatedMargin
  if (!Number.isFinite(m) || m <= 0) return null
  return (p.unrealizedPnl / m) * 100
}

/** 线性 USDT 合约：仓位名义（USDT）= 张数 × 每张基础币数量 × 价格（与 store 内 PnL 口径一致） */
function positionNotionalUsdt(p: FuturesPositionRow, contractSizeBase: number): number | null {
  if (!(contractSizeBase > 0) || !Number.isFinite(p.contracts) || p.contracts <= 0) return null
  const px = p.markPrice > 0 ? p.markPrice : p.entryPrice
  if (!(px > 0)) return null
  return p.contracts * contractSizeBase * px
}

/** 永续「类型」列：仅市价 / 限价（条件单等按限价展示） */
function perpetualEntryTypeLabel(t: FuturesOrderType | undefined): string {
  if (t === 'MARKET') return '市价'
  return '限价'
}

export function mapFuturesPositionsToTableRows(
  rows: FuturesPositionRow[],
  opts?: {
    nowMs?: number
    /** 交割等：「仓位数量」展示为 USDT 名义（按标记价优先） */
    positionQtyAsUsdtNotional?: boolean
    contractSizeBase?: number
    /** 交割：合约列用 settle 时刻推导的 YYMMDDHHmm 展示码 */
    deliveryContractPeriodCode?: boolean
    /**
     * 永续当前持仓：方向为买入/卖出，「类型」为市价/限价，与交割（多/空、无类型列）区分
     */
    perpetualUi?: boolean
  },
): PositionsTableRow[] {
  const nowMs = opts?.nowMs
  const cs = opts?.contractSizeBase ?? 0
  const qtyAsNotional = opts?.positionQtyAsUsdtNotional === true && cs > 0
  const useDeliveryPeriodCode = opts?.deliveryContractPeriodCode === true
  const perpetualUi = opts?.perpetualUi === true

  return rows.map((p) => {
    const roi = roiPercent(p)
    const roiDisplay = roi != null && Number.isFinite(roi) ? formatPct(roi) : '—'
    let deliveryCountdownDisplay: string | undefined
    if (p.deliverySettlesAtMs != null && nowMs != null && Number.isFinite(nowMs)) {
      const leftSec = Math.max(0, Math.floor((p.deliverySettlesAtMs - nowMs) / 1000))
      deliveryCountdownDisplay = formatDeliveryCountdownHms(leftSec)
    }

    const nominal = qtyAsNotional ? positionNotionalUsdt(p, cs) : null
    const contractsDisplay =
      nominal != null && Number.isFinite(nominal) ? formatPrice(nominal) : formatOrderQty(p.contracts)

    const symbolDisplay =
      useDeliveryPeriodCode && p.deliverySettlesAtMs != null
        ? buildDeliveryContractCodeFromSettleEndMs(p.symbol, p.deliverySettlesAtMs)
        : formatPairSymbol(p.symbol)

    return {
      positionId: p.positionId,
      symbolDisplay,
      side: perpetualUi
        ? {
            text: p.side === 'LONG' ? '买入' : '卖出',
            tone: p.side === 'LONG' ? 'long' : 'short',
          }
        : {
            text: positionSideText(p.side),
            tone: p.side === 'LONG' ? 'long' : 'short',
          },
      typeLabel: perpetualUi ? perpetualEntryTypeLabel(p.entryOrderType) : undefined,
      contractsDisplay,
      entryPriceDisplay: formatPrice(p.entryPrice),
      markPriceDisplay: formatPrice(p.markPrice),
      unrealizedPnlDisplay: formatSignedQuote(p.unrealizedPnl),
      unrealizedPnlTone: pnlTone(p.unrealizedPnl),
      roiDisplay,
      roiTone: roiTone(p.unrealizedPnl, roi),
      marginModeLabel: p.marginMode === 'CROSS' ? '全仓' : '逐仓',
      leverageDisplay: `${p.leverage}x`,
      liquidationDisplay:
        p.liquidationPrice != null && Number.isFinite(p.liquidationPrice)
          ? formatPrice(p.liquidationPrice)
          : '—',
      deliveryCountdownDisplay,
    }
  })
}
