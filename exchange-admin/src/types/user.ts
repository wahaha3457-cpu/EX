export interface UserProfile {
  userCode: string
  nickname?: string
  emailMasked?: string
  avatarUrl?: string
  kycLevel?: number
  status?: number
  /** 权限角色，用于后台 requiresAdmin 等 */
  roles?: string[]
}
