import type { RecentTradeRow } from '@/types/recentTrades'

/** 演示用最新成交（与 spotTradeMock.mockTrades 字段一致） */
export function mockRecentTrades(midPrice: number, count = 24): RecentTradeRow[] {
  const out: RecentTradeRow[] = []
  for (let i = 0; i < count; i++) {
    const side: RecentTradeRow['side'] = Math.random() > 0.5 ? 'BUY' : 'SELL'
    out.push({
      id: `mock-rt-${Date.now()}-${i}`,
      price: midPrice * (1 + (Math.random() * 0.0006 - 0.0003)),
      quantity: Math.random() * 0.8 + 0.02,
      side,
      time: new Date(Date.now() - i * 1300).toISOString(),
    })
  }
  return out
}
