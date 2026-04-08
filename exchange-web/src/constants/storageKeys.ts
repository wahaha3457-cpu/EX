export const StorageKeys = {
  ACCESS_TOKEN: 'ex_access_token',
  REFRESH_TOKEN: 'ex_refresh_token',
  TOKEN_EXPIRES_AT: 'ex_token_expires_at',
  /** 演示合约本地合并数据按此用户隔离；与 token 同步写入/清除 */
  DEMO_SCOPE_USER_CODE: 'ex_demo_scope_user_code',
} as const
