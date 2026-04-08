/** WebSocket 环境：未配置 URL 时走本地 mock 流，避免开发环境误连 */

export function getPublicWsUrl(): string | undefined {
  const u = import.meta.env.VITE_WS_PUBLIC_URL
  return typeof u === 'string' && u.trim().length > 0 ? u.trim() : undefined
}

export function getPrivateWsUrl(): string | undefined {
  const u = import.meta.env.VITE_WS_PRIVATE_URL
  return typeof u === 'string' && u.trim().length > 0 ? u.trim() : undefined
}

export function isPublicWsConfigured(): boolean {
  return Boolean(getPublicWsUrl())
}

export function isPrivateWsConfigured(): boolean {
  return Boolean(getPrivateWsUrl())
}
