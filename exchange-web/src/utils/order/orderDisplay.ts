import type { FuturesMarginMode, FuturesOrderType } from '@/types/futuresTrade'
import type { SpotOrderType } from '@/types/spotTrade'
import type { CurrentOpenOrderStatusCell, CurrentOrderStatusTone } from '@/types/currentOrdersTable'
import type { OrderHistoryStatusCell, OrderHistoryStatusTone } from '@/types/orderHistoryTable'

/** 交易对展示：BTC_USDT → BTC/USDT；BTCUSDT → BTC/USDT */
export function formatPairSymbol(symbol: string): string {
  if (symbol.includes('/') || symbol.includes('_')) {
    return symbol.replace(/_/g, '/')
  }
  const m = symbol.match(/^(.+?)(USDT|USDC|BUSD|BTC|ETH|EUR|FDUSD)$/i)
  return m ? `${m[1]}/${m[2]}` : symbol
}

function statusTone(code: string): CurrentOrderStatusTone {
  const c = code.toUpperCase()
  if (
    c === 'NEW' ||
    c === 'OPEN' ||
    c === 'ACCEPTED' ||
    c === 'LIVE' ||
    c === 'WORKING'
  ) {
    return 'working'
  }
  if (c === 'PARTIALLY_FILLED' || c === 'PARTIAL') return 'partial'
  if (c === 'PENDING_CANCEL' || c === 'CANCELLING') return 'pending'
  return 'muted'
}

/** 将交易所原始状态码映射为中文标签 + 标签配色 */
export function orderStatusCell(code: string): CurrentOpenOrderStatusCell {
  const c = code.toUpperCase()
  let text = code
  if (c === 'NEW' || c === 'OPEN' || c === 'ACCEPTED' || c === 'LIVE' || c === 'WORKING')
    text = '未成交'
  else if (c === 'PARTIALLY_FILLED' || c === 'PARTIAL') text = '部分成交'
  else if (c === 'PENDING_CANCEL' || c === 'CANCELLING') text = '撤销中'
  else if (c === 'FILLED') text = '完全成交'
  else if (c === 'CANCELED' || c === 'CANCELLED') text = '已撤销'
  else if (c === 'REJECTED') text = '已拒绝'
  else if (c === 'EXPIRED') text = '已过期'

  return { text, tone: statusTone(code) }
}

export function spotOrderTypeLabel(t: SpotOrderType): string {
  if (t === 'LIMIT') return '限价'
  if (t === 'MARKET') return '市价'
  if (t === 'STOP') return '止盈止损'
  return t
}

/** 永续「当前委托 / 历史委托」列表「类型」列（限价 / 市价 / 条件） */
export function futuresOrderTypeLabel(t: FuturesOrderType): string {
  if (t === 'LIMIT') return '限价'
  if (t === 'MARKET') return '市价'
  if (t === 'CONDITIONAL') return '条件'
  return t
}

export function orderSideText(side: 'BUY' | 'SELL'): string {
  return side === 'BUY' ? '买入' : '卖出'
}

export function positionSideText(side: 'LONG' | 'SHORT'): string {
  return side === 'LONG' ? '多' : '空'
}

/** 保证金模式中文（合约表格） */
export function futuresMarginModeLabel(m: FuturesMarginMode): string {
  return m === 'CROSS' ? '全仓' : '逐仓'
}

function historyStatusTone(code: string): OrderHistoryStatusTone {
  const c = code.toUpperCase()
  if (c === 'FILLED') return 'success'
  if (c === 'PARTIALLY_FILLED' || c === 'PARTIAL') return 'partial'
  if (c === 'PENDING_CANCEL' || c === 'CANCELLING') return 'pending'
  if (c === 'REJECTED' || c === 'EXPIRED') return 'danger'
  return 'muted'
}

/** 历史委托终态标签（配色偏「结果」(成交/撤单/拒绝)） */
export function historyOrderStatusCell(code: string): OrderHistoryStatusCell {
  const base = orderStatusCell(code)
  const tone = historyStatusTone(code)
  return { text: base.text, tone }
}
