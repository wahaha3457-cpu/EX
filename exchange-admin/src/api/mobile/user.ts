import { http } from '@/api/common/http'
import type { ApiResult } from '@/types/api'
import type { MobileUserProfile } from './types'

/** 预留：移动端「我的」摘要 */
export function fetchMobileProfile() {
  return http.get<ApiResult<MobileUserProfile>>('/app/user/mobile-profile').then((res) => res.data.data)
}
