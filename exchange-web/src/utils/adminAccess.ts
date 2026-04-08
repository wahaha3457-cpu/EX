import type { UserProfile } from '@/types/user'

/** 是否与 exchange-server SecurityUser 一致：userCode 以 A 开头 => ROLE_ADMIN */
export function isAdminProfile(user: UserProfile | null | undefined): boolean {
  if (!user) return false
  if (user.roles?.some((r) => r === 'ADMIN' || r === 'SUPER_ADMIN')) return true
  return !!user.userCode && user.userCode.startsWith('A')
}
