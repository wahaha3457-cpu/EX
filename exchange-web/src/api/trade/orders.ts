import type { SpotPlaceOrderRequest } from '@/types/spotTrade'
import { isExchangeSpotApiEnabled, isLegacyAuthMode } from '@/config/env'
import { legacyCancelSpotOrder, legacyPlaceSpotOrder } from '@/api/trade/legacy/legacySpotOrders'

/**
 * 现货订单 API
 * - Legacy：`/api/exchangeapplyorder!open.action` / `!cancel.action`
 * - 主干：`POST|DELETE /api/v1/spot/orders`
 */

export async function placeSpotOrder(body: SpotPlaceOrderRequest): Promise<void> {
  if (isLegacyAuthMode()) {
    await legacyPlaceSpotOrder(body)
    return
  }
  if (isExchangeSpotApiEnabled()) {
    const { placeExchangeSpotOrder } = await import('@/api/trade/exchangeSpot')
    await placeExchangeSpotOrder(body)
  }
}

export async function cancelSpotOrder(orderNo: string): Promise<void> {
  if (isLegacyAuthMode()) {
    await legacyCancelSpotOrder(orderNo)
    return
  }
  if (isExchangeSpotApiEnabled()) {
    if (!/^\d+$/.test(orderNo)) {
      throw new Error('订单号无效，请刷新列表后重试')
    }
    const { cancelExchangeSpotOrder } = await import('@/api/trade/exchangeSpot')
    await cancelExchangeSpotOrder(orderNo)
    return
  }
}

export async function cancelAllSpotOrders(symbol: string): Promise<void> {
  if (isExchangeSpotApiEnabled()) {
    const { cancelAllExchangeSpotOrders } = await import('@/api/trade/exchangeSpot')
    await cancelAllExchangeSpotOrders(symbol)
  }
}
