/**
 * 演示用资金密码（6 位数字）。仅存浏览器 localStorage，非真实安全实现。
 */

const storageKey = (id: string) => `ex.fundPwd.v1.${id}`

interface Stored {
  v: 1
  h: string
}

/** 同一用户可能同时用 userCode 与邮箱掩码索引，避免登录/资料接口 userCode 不一致时误判「未设置」 */
function candidateIds(
  userCode: string | undefined | null,
  emailMasked: string | undefined | null,
): string[] {
  const ids: string[] = []
  const uc = userCode?.trim()
  if (uc && uc !== 'UNKNOWN') ids.push(uc)
  const em = emailMasked?.trim()
  if (em) ids.push(`m:${em}`)
  return ids
}

function encodeDemo(id: string, pwd: string): string {
  return btoa(unescape(encodeURIComponent(`fp|${id}|${pwd}|ex-demo`)))
}

function parseStored(raw: string): Stored | null {
  try {
    const p = JSON.parse(raw) as Stored
    if (p?.v === 1 && typeof p?.h === 'string' && p.h.length > 0) return p
  } catch {
    /* ignore */
  }
  return null
}

export function isValidFundPasswordFormat(pwd: string): boolean {
  return /^\d{6}$/.test(pwd)
}

export function isFundPasswordSet(
  userCode: string | undefined | null,
  emailMasked?: string | undefined | null,
): boolean {
  const ids = candidateIds(userCode, emailMasked)
  if (!ids.length) return false
  try {
    for (const id of ids) {
      const raw = localStorage.getItem(storageKey(id))
      if (!raw) continue
      if (parseStored(raw)) return true
    }
    return false
  } catch {
    return false
  }
}

export function setFundPassword(
  userCode: string | undefined | null,
  emailMasked: string | undefined | null,
  pwd: string,
): void {
  if (!isValidFundPasswordFormat(pwd)) {
    throw new Error('INVALID_FORMAT')
  }
  const ids = candidateIds(userCode, emailMasked)
  if (!ids.length) {
    throw new Error('NO_USER_KEY')
  }
  for (const id of ids) {
    const row: Stored = { v: 1, h: encodeDemo(id, pwd) }
    localStorage.setItem(storageKey(id), JSON.stringify(row))
  }
}

export function verifyFundPassword(
  userCode: string | undefined | null,
  emailMasked: string | undefined | null,
  pwd: string,
): boolean {
  if (!isValidFundPasswordFormat(pwd)) return false
  const ids = candidateIds(userCode, emailMasked)
  if (!ids.length) return false
  try {
    for (const id of ids) {
      const raw = localStorage.getItem(storageKey(id))
      if (!raw) continue
      const p = parseStored(raw)
      if (!p) continue
      if (p.h === encodeDemo(id, pwd)) return true
    }
    return false
  } catch {
    return false
  }
}

export type ChangeFundPasswordResult = { ok: true } | { ok: false; reason: 'NOT_SET' | 'BAD_OLD' | 'INVALID_NEW' }

export function changeFundPassword(
  userCode: string | undefined | null,
  emailMasked: string | undefined | null,
  oldPwd: string,
  newPwd: string,
): ChangeFundPasswordResult {
  if (!isFundPasswordSet(userCode, emailMasked)) return { ok: false, reason: 'NOT_SET' }
  if (!verifyFundPassword(userCode, emailMasked, oldPwd)) return { ok: false, reason: 'BAD_OLD' }
  if (!isValidFundPasswordFormat(newPwd)) return { ok: false, reason: 'INVALID_NEW' }
  setFundPassword(userCode, emailMasked, newPwd)
  return { ok: true }
}
