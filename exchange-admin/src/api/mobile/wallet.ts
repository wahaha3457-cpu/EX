import { http } from '@/api/common/http'
import type { ApiResult } from '@/types/api'
import type { MobileWalletOverview } from './types'

/** 预留：钱包总览（示例路径，按后端实际调整） */
export function fetchWalletOverview() {
  return http
    .get<ApiResult<MobileWalletOverview>>('/app/wallet/overview')
    .then((res) => res.data.data)
}

/** 预留：近期流水 */
export function fetchWalletLedger(page = 1, pageSize = 20) {
  return http
    .get<ApiResult<{ list: unknown[] }>>('/app/wallet/ledger', { params: { page, pageSize } })
    .then((res) => res.data.data)
}
