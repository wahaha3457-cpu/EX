/**
 * 用户中心顶部资料覆盖层（演示）：头像、昵称覆盖、VIP 演示交易量。
 * 生产应对齐 PUT /v1/users/profile 与 VIP 快照接口。
 */

export interface UcProfileOverlay {
  /** 覆盖展示昵称（不改 Mock 注册表时可单独持久化） */
  displayNickname?: string
  /** JPEG data URL，由本地上传生成 */
  avatarDataUrl?: string | null
  /** 演示用 30 日折算交易量；未设置则按账户 tier 估算 */
  mock30dVolumeUsdt?: number
}

const PREFIX = 'ex-uc-profile:v1:'

export function readUcProfileOverlay(userCode: string): UcProfileOverlay {
  if (!userCode) return {}
  try {
    const raw = localStorage.getItem(PREFIX + userCode)
    if (!raw) return {}
    const o = JSON.parse(raw) as UcProfileOverlay
    return o && typeof o === 'object' ? o : {}
  } catch {
    return {}
  }
}

export function writeUcProfileOverlay(userCode: string, patch: Partial<UcProfileOverlay>): UcProfileOverlay {
  if (!userCode) return {}
  const next = { ...readUcProfileOverlay(userCode), ...patch }
  try {
    localStorage.setItem(PREFIX + userCode, JSON.stringify(next))
  } catch {
    /* quota */
  }
  return next
}
