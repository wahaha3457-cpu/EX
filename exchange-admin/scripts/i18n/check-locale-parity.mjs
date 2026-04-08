#!/usr/bin/env node
/**
 * CI：校验「主语言」之间扁平 key 完全一致，缺失即非 0 退出码。
 *
 * 用法：node scripts/i18n/check-locale-parity.mjs
 * 环境变量：
 *   PRIMARY_LOCALES=zh-CN,en,zh-TW  （默认）
 */
import { getMerged, flattenKeys } from './mergeLocales.mjs'

const primary = (process.env.PRIMARY_LOCALES || 'zh-CN,en,zh-TW')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const sets = {}
for (const loc of primary) {
  sets[loc] = new Set(flattenKeys(getMerged(loc)))
}

const base = primary[0]
const baseSet = sets[base]
let failed = false

for (const loc of primary.slice(1)) {
  const s = sets[loc]
  const onlyBase = [...baseSet].filter((k) => !s.has(k))
  const onlyOther = [...s].filter((k) => !baseSet.has(k))
  if (onlyBase.length || onlyOther.length) {
    failed = true
    console.error(`\n[locale-parity] ${base} vs ${loc} mismatch:`)
    if (onlyBase.length) console.error(`  only in ${base} (${onlyBase.length}):`, onlyBase.slice(0, 20), onlyBase.length > 20 ? '...' : '')
    if (onlyOther.length) console.error(`  only in ${loc} (${onlyOther.length}):`, onlyOther.slice(0, 20), onlyOther.length > 20 ? '...' : '')
  }
}

if (failed) {
  console.error('\n[locale-parity] FAILED: align JSON keys across PRIMARY_LOCALES.')
  process.exit(1)
}

console.log(`[locale-parity] OK: ${primary.join(', ')} share ${baseSet.size} keys.`)
