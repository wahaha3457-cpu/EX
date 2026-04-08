import { http } from '@/api/common/http'
import type { ApiResult, PageResult } from '@/types/api'
import type { MobileTaskRow } from './types'

/** 预留：任务市场列表 */
export function fetchTaskMarket(params?: { category?: string; sort?: string; page?: number }) {
  return http
    .get<ApiResult<PageResult<MobileTaskRow>>>('/app/tasks/market', { params })
    .then((res) => res.data.data)
}

/** 预留：发布任务 */
export function createTask(payload: Record<string, unknown>) {
  return http.post<ApiResult<{ id: string }>>('/app/tasks', payload).then((res) => res.data.data)
}
