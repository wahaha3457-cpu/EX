import { storeToRefs } from 'pinia'
import { useSpotTradeStore } from '@/stores/spotTrade'
import { useFuturesTradeStore } from '@/stores/futuresTrade'
import type { TradeSurface } from '@/composables/useTicker'

/** 盘口深度快照 */
export function useDepth(surface: TradeSurface) {
  if (surface === 'spot') {
    const s = useSpotTradeStore()
    const { depth, symbol, loading } = storeToRefs(s)
    return { surface, depth, symbol, loading, applyDepth: s.applyDepth }
  }
  const s = useFuturesTradeStore()
  const { depth, symbol, loading } = storeToRefs(s)
  return { surface, depth, symbol, loading, applyDepth: s.applyDepth }
}
