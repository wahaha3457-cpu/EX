import { adaptFuturesTradeBootstrap } from '@/api/contract/contract.adapter'
import { fetchFuturesTradeBootstrapRaw } from '@/api/contract/contract.api'
import type { FuturesTradeBootstrap } from '@/api/contract/contract.types'

export async function fetchFuturesTradeBootstrap(symbol: string): Promise<FuturesTradeBootstrap> {
  const raw = await fetchFuturesTradeBootstrapRaw(symbol)
  return adaptFuturesTradeBootstrap(raw)
}

export type { FuturesTradeBootstrap, FuturesTradeBootstrapRaw } from '@/api/contract/contract.types'
/** 与历史命名兼容 */
export type { FuturesTradeBootstrap as FuturesTradeBootstrapDto } from '@/api/contract/contract.types'
