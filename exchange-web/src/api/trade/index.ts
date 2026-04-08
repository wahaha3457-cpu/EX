import { adaptSpotTradeBootstrap } from '@/api/trade/trade.adapter'
import { fetchSpotTradeBootstrapRaw } from '@/api/trade/trade.api'
import type { SpotTradeBootstrap } from '@/api/trade/trade.types'

/** 对外唯一入口：原始接口 → 统一业务结构 */
export async function fetchSpotTradeBootstrap(symbol: string): Promise<SpotTradeBootstrap> {
  const raw = await fetchSpotTradeBootstrapRaw(symbol)
  return adaptSpotTradeBootstrap(raw)
}

export type { SpotTradeBootstrap } from '@/api/trade/trade.types'
/** 与历史命名兼容 */
export type { SpotTradeBootstrap as SpotTradeBootstrapDto } from '@/api/trade/trade.types'
export type { SpotTradeBootstrapRaw } from '@/api/trade/trade.types'
