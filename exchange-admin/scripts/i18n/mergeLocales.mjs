/**
 * 与构建时一致的 locale 合并逻辑（供 Node 校验脚本使用，不依赖 TS 路径别名）。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const messagesRoot = path.join(__dirname, '../../src/locales/messages')

export function mergeTwo(a, b) {
  const out = { ...a }
  for (const key of Object.keys(b)) {
    const bv = b[key]
    const av = out[key]
    if (
      bv !== null &&
      typeof bv === 'object' &&
      !Array.isArray(bv) &&
      av !== null &&
      typeof av === 'object' &&
      !Array.isArray(av)
    ) {
      out[key] = mergeTwo(av, bv)
    } else {
      out[key] = bv
    }
  }
  return out
}

export function mergeDeep(base, ...patches) {
  let o = { ...base }
  for (const p of patches) {
    o = mergeTwo(o, p)
  }
  return o
}

function read(name) {
  return JSON.parse(fs.readFileSync(path.join(messagesRoot, name), 'utf8'))
}

/** 与 getLocaleMessages 中 zh-CN / en / zh-TW 合并结果一致 */
export function getMerged(locale) {
  const base = read(`${locale}.json`)
  const fr = (f) => read(`fragments/${locale}/${f}`)
  return mergeDeep(
    base,
    fr('routes.json'),
    fr('auth.json'),
    fr('pages.json'),
    fr('admin.json'),
    fr('kyc.json'),
    fr('nft.json'),
    fr('news.json'),
    fr('charity.json'),
  )
}

export function flattenKeys(obj, prefix = '') {
  const keys = []
  for (const k of Object.keys(obj)) {
    const p = prefix ? `${prefix}.${k}` : k
    const v = obj[k]
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, p))
    } else {
      keys.push(p)
    }
  }
  return keys.sort()
}
