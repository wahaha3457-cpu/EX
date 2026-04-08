import { http } from '@/api/common/http'
import type { ApiResult } from '@/types/api'
import type { MobileOtcAdRow } from './types'

/** 预留：C2C / OTC 广告列表 */
export function fetchOtcAds(_params?: { side?: 'buy' | 'sell'; fiat?: string }) {
  return http
    .get<ApiResult<MobileOtcAdRow[]>>('/app/otc/ads', { params: _params })
    .then((res) => res.data.data)
}
