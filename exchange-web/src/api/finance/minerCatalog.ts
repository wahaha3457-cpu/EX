import type { MinerOrder, MinerProduct } from '@/types/financeEarn'

export const MINER_PRODUCTS: MinerProduct[] = [
  {
    id: 'm-btc-30',
    name: 'BTC 算力 · 标准型',
    hashrateTh: 50,
    durationDays: 30,
    priceUsdt: 499,
    estDailyUsdt: 2.1,
    coin: 'BTC',
    soldPct: 62,
  },
  {
    id: 'm-btc-90',
    name: 'BTC 算力 · 进阶型',
    hashrateTh: 200,
    durationDays: 90,
    priceUsdt: 1888,
    estDailyUsdt: 9.6,
    coin: 'BTC',
    soldPct: 38,
  },
  {
    id: 'm-btc-180',
    name: 'BTC 算力 · 旗舰型',
    hashrateTh: 500,
    durationDays: 180,
    priceUsdt: 4280,
    estDailyUsdt: 24.8,
    coin: 'BTC',
    soldPct: 71,
  },
]

export function mockInitialMinerOrders(): MinerOrder[] {
  const now = Date.now()
  return [
    {
      id: 'mo-1',
      productId: 'm-btc-30',
      quantity: 1,
      purchasedAt: new Date(now - 8 * 86400000).toISOString(),
      endAt: new Date(now + 22 * 86400000).toISOString(),
      status: 'MINING',
      paidUsdt: 499,
    },
    {
      id: 'mo-0',
      productId: 'm-btc-90',
      quantity: 1,
      purchasedAt: new Date(now - 120 * 86400000).toISOString(),
      endAt: new Date(now - 30 * 86400000).toISOString(),
      status: 'SETTLED',
      paidUsdt: 1888,
    },
  ]
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function fetchMinerCatalog(): Promise<{ products: MinerProduct[]; orders: MinerOrder[] }> {
  await delay(120)
  return { products: [...MINER_PRODUCTS], orders: mockInitialMinerOrders() }
}
