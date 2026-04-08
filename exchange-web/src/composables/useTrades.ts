import { storeToRefs } from 'pinia'
import { useSpotTradeStore } from '@/stores/spotTrade'
import { useFuturesTradeStore } from '@/stores/futuresTrade'
import type { TradeSurface } from '@/composables/useTicker'

/** 最新成交列表 */
export function useTrades(surface: TradeSurface) {
  if (surface === 'spot') {
    const s = useSpotTradeStore()
    const { trades, symbol, loading } = storeToRefs(s)
    return { surface, trades, symbol, loading, pushTrade: s.pushTrade }
  }
  const s = useFuturesTradeStore()
  const { trades, symbol, loading } = storeToRefs(s)
  return { surface, trades, symbol, loading, pushTrade: s.pushTrade }
}
