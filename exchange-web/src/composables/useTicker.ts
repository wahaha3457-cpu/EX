import { storeToRefs } from 'pinia'
import { useSpotTradeStore } from '@/stores/spotTrade'
import { useFuturesTradeStore } from '@/stores/futuresTrade'

export type TradeSurface = 'spot' | 'futures'

/**
 * 行情 ticker：从对应交易 store 取数，供页面与业务组件复用。
 */
export function useTicker(surface: TradeSurface) {
  if (surface === 'spot') {
    const s = useSpotTradeStore()
    return { surface, ...storeToRefs(s) }
  }
  const s = useFuturesTradeStore()
  return { surface, ...storeToRefs(s) }
}
