import type { OrderHistoryTableRow } from '@/types/orderHistoryTable'

export const mockOrderHistorySpotRows: OrderHistoryTableRow[] = [
  {
    orderNo: 'H-MOCK-1',
    symbolDisplay: 'BTC/USDT',
    typeLabel: '限价',
    side: { text: '卖出', tone: 'sell' },
    priceDisplay: '68,200.00',
    quantityDisplay: '0.02',
    avgFillDisplay: '68,180.50',
    filledVolumeDisplay: '0.02',
    status: { text: '完全成交', tone: 'success' },
    timeDisplay: '2026/3/28 22:15:09',
  },
]

export const mockOrderHistoryFuturesRows: OrderHistoryTableRow[] = [
  {
    orderNo: 'FH-MOCK-1',
    symbolDisplay: 'BTC/USDT',
    typeLabel: '限价',
    side: { text: '卖出', tone: 'sell' },
    priceDisplay: '68,500.00',
    quantityDisplay: '2',
    avgFillDisplay: '68,480.00',
    filledVolumeDisplay: '2',
    status: { text: '完全成交', tone: 'success' },
    timeDisplay: '2026/3/28 21:40:00',
    futuresExtras: {
      positionSide: { text: '多', tone: 'long' },
      leverageDisplay: '20倍',
      marginModeDisplay: '全仓',
      positionNotionalDisplay: '1,000.00',
      filledNotionalDisplay: '1,000.00',
    },
  },
]
