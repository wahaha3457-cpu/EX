/**
 * 深度合并 locale 对象（后者覆盖前者同路径叶子节点）。
 */
export function mergeDeep<T extends Record<string, unknown>>(base: T, ...rest: Partial<T>[]): T {
  let out: Record<string, unknown> = { ...base }
  for (const patch of rest) {
    if (!patch || typeof patch !== 'object') continue
    out = mergeTwo(out, patch as Record<string, unknown>)
  }
  return out as T
}

function mergeTwo(a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...a }
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
      out[key] = mergeTwo(av as Record<string, unknown>, bv as Record<string, unknown>)
    } else {
      out[key] = bv
    }
  }
  return out
}
