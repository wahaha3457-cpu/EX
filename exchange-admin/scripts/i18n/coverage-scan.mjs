#!/usr/bin/env node
/**
 * i18n 覆盖率启发式扫描（非 AST 级精确统计）：
 * - 统计含 CJK 的 .vue / .ts 文件数（排除 locales、*.d.ts、测试、脚本自身）
 * - 可选 --fail-over N：若「疑似未国际化文件数」> N 则 exit 1
 *
 * 用法：
 *   node scripts/i18n/coverage-scan.mjs
 *   node scripts/i18n/coverage-scan.mjs --fail-over 120
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcRoot = path.join(__dirname, '../../src')

const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufadf]/

const EXCLUDE_DIR = new Set([
  'locales',
  'node_modules',
  'dist',
])
const EXCLUDE_FILE = (f) =>
  f.endsWith('.d.ts') || f.includes('.test.') || f.includes('.spec.')

let failOver = Infinity
const argv = process.argv.slice(2)
const fo = argv.indexOf('--fail-over')
if (fo >= 0 && argv[fo + 1]) failOver = Number(argv[fo + 1])

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    const st = fs.statSync(p)
    if (st.isDirectory()) {
      if (EXCLUDE_DIR.has(name)) continue
      walk(p, out)
    } else {
      out.push(p)
    }
  }
  return out
}

function hasCjk(content) {
  return CJK_RE.test(content)
}

const allFiles = walk(srcRoot).filter((f) => {
  if (!/\.(vue|ts)$/.test(f)) return false
  if (EXCLUDE_FILE(f)) return false
  return true
})

let withCjk = 0
const samples = []
for (const f of allFiles) {
  const c = fs.readFileSync(f, 'utf8')
  if (hasCjk(c)) {
    withCjk++
    if (samples.length < 15) samples.push(path.relative(path.join(__dirname, '../..'), f))
  }
}

const total = allFiles.length
const ratio = total ? ((withCjk / total) * 100).toFixed(1) : '0'

console.log(`[i18n-coverage] scanned ${total} vue/ts files under src/`)
console.log(`[i18n-coverage] files containing CJK (heuristic): ${withCjk} (${ratio}%)`)
console.log(`[i18n-coverage] sample paths:`, samples.join(', ') || '(none)')

if (withCjk > failOver) {
  console.error(`\n[i18n-coverage] FAIL: CJK file count ${withCjk} > --fail-over ${failOver}`)
  process.exit(1)
}

console.log('[i18n-coverage] OK (threshold not exceeded or disabled).')
