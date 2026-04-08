import type { SpotConditionalIntentKind } from '@/types/spotConditional'
import type { SpotOrderSide } from '@/types/spotTrade'

/**
 * 根据触发价相对「参考最新价」的位置识别意图（与主流所条件限价逻辑一致）。
 */
export function deriveConditionalIntent(
  side: SpotOrderSide,
  triggerPrice: number,
  lastRef: number | null | undefined,
): SpotConditionalIntentKind | null {
  if (lastRef == null || !Number.isFinite(lastRef) || lastRef <= 0) return null
  if (!Number.isFinite(triggerPrice) || triggerPrice <= 0) return null
  if (side === 'BUY') {
    return triggerPrice > lastRef ? 'breakout_buy' : 'dip_buy'
  }
  return triggerPrice < lastRef ? 'stop_sell' : 'tp_sell'
}

export function shouldTriggerIntent(
  kind: SpotConditionalIntentKind,
  lastPrice: number,
  triggerPrice: number,
): boolean {
  if (!Number.isFinite(lastPrice) || lastPrice <= 0) return false
  if (!Number.isFinite(triggerPrice) || triggerPrice <= 0) return false
  switch (kind) {
    case 'breakout_buy':
    case 'tp_sell':
      return lastPrice >= triggerPrice
    case 'dip_buy':
    case 'stop_sell':
      return lastPrice <= triggerPrice
    default:
      return false
  }
}

export function intentTitleZh(kind: SpotConditionalIntentKind): string {
  switch (kind) {
    case 'breakout_buy':
      return '突破买入'
    case 'dip_buy':
      return '回调买入'
    case 'stop_sell':
      return '止损卖出'
    case 'tp_sell':
      return '止盈卖出'
    default:
      return '条件限价'
  }
}

export function intentDescriptionZh(kind: SpotConditionalIntentKind): string {
  switch (kind) {
    case 'breakout_buy':
      return '当最新价上涨并触及或超过触发价时，将按您设定的委托价挂出买单。'
    case 'dip_buy':
      return '当最新价下跌并触及或低于触发价时，将按您设定的委托价挂出买单。'
    case 'stop_sell':
      return '当最新价下跌并触及或低于触发价时，将按您设定的委托价挂出卖单。'
    case 'tp_sell':
      return '当最新价上涨并触及或超过触发价时，将按您设定的委托价挂出卖单。'
    default:
      return '条件满足后，将提交限价委托至订单簿。'
  }
}
