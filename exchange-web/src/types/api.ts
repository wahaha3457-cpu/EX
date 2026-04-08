/** 与后端统一响应契约对齐（主干） */
export interface ApiResult<T = unknown> {
  success: boolean
  code: string
  message: string
  data: T
  traceId?: string
  timestamp?: number
}

export interface PageResult<T> {
  list: T[]
  page: number
  pageSize: number
  total: number
  hasMore?: boolean
}
