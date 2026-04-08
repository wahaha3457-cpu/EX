const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** 中国大陆手机 11 位 */
const PHONE_RE = /^1[3-9]\d{9}$/
/** 账号：字母开头，4–20 位字母数字下划线 */
const ACCOUNT_RE = /^[a-zA-Z][a-zA-Z0-9_]{3,19}$/

export function normalizeEmail(v: string): string {
  return v.trim().toLowerCase()
}

export function normalizePhone(v: string): string {
  return v.replace(/\D/g, '').slice(0, 11)
}

export function normalizeAccount(v: string): string {
  return v.trim().toLowerCase()
}

export function isValidEmail(v: string): boolean {
  return EMAIL_RE.test(normalizeEmail(v))
}

export function isValidPhone(v: string): boolean {
  return PHONE_RE.test(normalizePhone(v))
}

export function isValidAccount(v: string): boolean {
  return ACCOUNT_RE.test(normalizeAccount(v))
}

/** 最低 8 位，含字母与数字（币安类常见规则简化） */
export function isValidPassword(v: string): boolean {
  if (v.length < 8 || v.length > 64) return false
  if (!/[a-zA-Z]/.test(v)) return false
  if (!/\d/.test(v)) return false
  return true
}

export function passwordHint(): string {
  return '8–64 位，需同时包含字母与数字'
}
