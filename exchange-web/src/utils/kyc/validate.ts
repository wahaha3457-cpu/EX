/**
 * KYC 前端校验（演示级规则，可与服务端对齐）
 */

const CN_ID_RE = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/

/** 18 位中国大陆身份证校验码 */
export function isValidCnIdCard(id: string): boolean {
  const s = id.trim()
  if (!CN_ID_RE.test(s)) return false
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const codes = '10X98765432'
  let sum = 0
  for (let i = 0; i < 17; i++) sum += parseInt(s[i]!, 10) * weights[i]!
  const check = codes[sum % 11]!
  return check === s[17]!.toUpperCase()
}

/** 出生日期 YYYY-MM-DD 是否已满 ageMin 周岁 */
export function isAgeAtLeast(dobIsoDate: string, ageMin: number): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dobIsoDate.trim())
  if (!m) return false
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const birth = new Date(y, mo - 1, d)
  if (Number.isNaN(birth.getTime())) return false
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const dm = now.getMonth() - birth.getMonth()
  if (dm < 0 || (dm === 0 && now.getDate() < birth.getDate())) age -= 1
  return age >= ageMin
}

export function isReasonablePassportNumber(raw: string): boolean {
  const s = raw.trim()
  return s.length >= 6 && s.length <= 20 && /^[0-9A-Za-z]+$/.test(s)
}
