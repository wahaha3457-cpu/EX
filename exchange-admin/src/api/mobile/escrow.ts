import { http } from '@/api/common/http'
import type { ApiResult } from '@/types/api'

/** 预留：创建托管 */
export function createEscrow(payload: Record<string, unknown>) {
  return http.post<ApiResult<{ id: string }>>('/app/escrow', payload).then((res) => res.data.data)
}
