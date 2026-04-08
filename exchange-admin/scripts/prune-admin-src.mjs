/**
 * 自 src/main.ts / App.vue / router 入口做静态依赖遍历，删除未被引用的源码文件。
 * 仅用于 exchange-admin 独立仓库瘦身；执行前请已提交 git。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const srcRoot = path.join(projectRoot, 'src')

const seeds = ['src/main.ts', 'src/App.vue', 'src/router/index.ts'].map((p) =>
  path.join(projectRoot, p),
)

const keep = new Set()

function walkDir(dir, out) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name)
    if (name.isDirectory()) walkDir(p, out)
    else out.push(p)
  }
}

function tryFile(p) {
  const candidates = [
    p,
    `${p}.ts`,
    `${p}.vue`,
    `${p}.tsx`,
    `${p}.js`,
    `${p}.scss`,
    `${p}.json`,
    path.join(p, 'index.ts'),
    path.join(p, 'index.vue'),
  ]
  for (const c of candidates) {
    try {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) return path.resolve(c)
    } catch {
      /* ignore */
    }
  }
  return null
}

function resolveSpecifier(fromAbs, spec) {
  const s = spec.replace(/\?.*$/, '').trim()
  if (s.startsWith('@/')) {
    const rel = s.slice(2)
    return tryFile(path.join(srcRoot, rel))
  }
  if (s.startsWith('.')) {
    const base = path.resolve(path.dirname(fromAbs), s)
    return tryFile(base)
  }
  return null
}

const patterns = [
  /(?:from\s+|import\s+)['"]([^'"]+)['"]/g,
  /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /@(?:use|import)\s+['"]([^'"]+)['"]/g,
]

function scan(fileAbs) {
  const abs = path.resolve(fileAbs)
  if (!abs.startsWith(srcRoot)) return
  if (keep.has(abs)) return
  if (!/\.(vue|ts|tsx|js|scss)$/.test(abs)) return
  keep.add(abs)
  let text
  try {
    text = fs.readFileSync(abs, 'utf8')
  } catch {
    return
  }
  for (const re of patterns) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(text))) {
      const spec = m[1]
      if (!spec || spec.startsWith('http')) continue
      const resolved = resolveSpecifier(abs, spec)
      if (resolved) scan(resolved)
    }
  }
}

for (const s of seeds) scan(s)

keep.add(path.join(srcRoot, 'types', 'router.d.ts'))

const stylesRoot = path.join(srcRoot, 'styles')
if (fs.existsSync(stylesRoot)) {
  const styleFiles = []
  walkDir(stylesRoot, styleFiles)
  for (const f of styleFiles) {
    if (f.endsWith('.scss')) keep.add(path.resolve(f))
  }
}

const localesRoot = path.join(srcRoot, 'locales')
if (fs.existsSync(localesRoot)) {
  const locFiles = []
  walkDir(localesRoot, locFiles)
  for (const f of locFiles) {
    if (f.endsWith('.json') || f.endsWith('.ts')) keep.add(path.resolve(f))
  }
}

const allFiles = []
walkDir(srcRoot, allFiles)

const toDelete = allFiles.filter((f) => !keep.has(path.resolve(f)))

for (const f of toDelete) {
  fs.unlinkSync(f)
  let dir = path.dirname(f)
  while (dir.startsWith(srcRoot) && dir !== srcRoot) {
    const entries = fs.readdirSync(dir)
    if (entries.length > 0) break
    fs.rmdirSync(dir)
    dir = path.dirname(dir)
  }
}

console.log(`kept ${keep.size} files, deleted ${toDelete.length} files`)
