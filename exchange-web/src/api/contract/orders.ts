import type { FuturesPlaceOrderRequest } from '@/types/futuresTrade'
import { isLegacyAuthMode, isMockMode } from '@/config/env'
import { legacyCancelFuturesOrder, legacyPlaceFuturesOrder } from '@/api/contract/legacy/legacyFuturesOrders'

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * 合约下单：Legacy 走 `/api/contractApplyOrder!open.action` / `close.action`；
 * Mock 模式为本地演示。
 */
export async function placeFuturesOrder(body: FuturesPlaceOrderRequest): Promise<void> {
  if (isMockMode()) {
    await delay(40)
    return
  }
  if (isLegacyAuthMode()) {
    return legacyPlaceFuturesOrder(body)
  }
  await delay(40)
}

export async function cancelFuturesOrder(orderNo: string): Promise<void> {
  if (isMockMode()) {
    await delay(20)
    return
  }
  if (isLegacyAuthMode()) {
    return legacyCancelFuturesOrder(orderNo)
  }
  await delay(20)
}
