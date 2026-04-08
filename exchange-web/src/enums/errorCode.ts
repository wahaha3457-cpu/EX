/**
 * 与后端 ErrorCode 对齐的前端子集（主干）。
 * 完整码表由后端文档维护，此处仅覆盖拦截器与通用提示常用项。
 */
export const ErrorCode = {
  OK: 'OK',
  AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_REFRESH_INVALID: 'AUTH_REFRESH_INVALID',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  SYS_INTERNAL_ERROR: 'SYS_INTERNAL_ERROR',
  SYS_PARAM_INVALID: 'SYS_PARAM_INVALID',
} as const

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode]
