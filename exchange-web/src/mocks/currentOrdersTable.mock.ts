import type { CurrentOpenOrderTableRow } from '@/types/currentOrdersTable'

/** 单测 / Story / 本地预览用展示行（已含格式化字段） */
export const mockCurrentOrdersTableSpotRows: CurrentOpenOrderTableRow[] = [
  {
    orderNo: 'MOCK-O-1',
    symbolDisplay: 'BTC/USDT',
    side: { text: '买入', tone: 'buy' },
    typeLabel: '限价',
    priceDisplay: '67,250.50',
    quantityDisplay: '0.015',
    filledDisplay: '0',
    amountDisplay: '1,008.76',
    tpSlDisplay: '--',
    status: { text: '未成交', tone: 'working' },
    timeDisplay: '2026/3/29 14:32:01',
  },
  {
    orderNo: 'MOCK-O-2',
    symbolDisplay: 'ETH/USDT',
    side: { text: '卖出', tone: 'sell' },
    typeLabel: '限价',
    priceDisplay: '3,580.00',
    quantityDisplay: '1.2',
    filledDisplay: '0.4',
    amountDisplay: '4,296.00',
    tpSlDisplay: '--',
    status: { text: '部分成交', tone: 'partial' },
    timeDisplay: '2026/3/29 14:28:44',
  },
]

export const mockCurrentOrdersTableFuturesRows: CurrentOpenOrderTableRow[] = [
  {
    orderNo: 'MOCK-FO-1',
    symbolDisplay: 'BTC/USDT',
    side: { text: '买入', tone: 'buy' },
    typeLabel: '限价',
    priceDisplay: '67,000.00',
    quantityDisplay: '5',
    filledDisplay: '0',
    status: { text: '未成交', tone: 'working' },
    timeDisplay: '2026/3/29 14:30:00',
    futuresExtras: {
      positionSide: { text: '多', tone: 'long' },
      reduceOnly: false,
      leverageDisplay: '20倍',
      marginModeDisplay: '全仓',
      positionNotionalDisplay: '1,000.00',
      filledNotionalDisplay: '0.00000000',
    },
  },
]
