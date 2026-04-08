/** 由指标键值确定性生成 0–1 归一化序列，用于仪表盘卡片装饰趋势线（无历史接口时的合理近似） */

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed(parts: (string | number)[]): number {
  let h = 2166136261
  for (const p of parts) {
    const s = String(p)
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
  }
  return h >>> 0
}

/**
 * @param metricKey 指标标识，保证同接口数据形状稳定
 * @param value 当前快照数值，影响波动幅度与整体倾斜方向
 * @param len 采样点数（模拟日内细粒度波动）
 */
export function buildTodaySparkline(metricKey: string, value: number, len = 36): number[] {
  const coarse = Number.isFinite(value) ? Math.round(value * 1000) / 1000 : 0
  const seed = hashSeed([metricKey, coarse])
  const rand = mulberry32(seed)
  const pts: number[] = []
  const mag = Math.min(14, Math.log10(Math.abs(value) + 1) * 1.15)
  const vol = 0.028 + mag * 0.004
  const drift = value >= 0 ? 0.0065 : -0.009
  let y = 0.38 + rand() * 0.22

  for (let i = 0; i < len; i++) {
    const t = i / Math.max(1, len - 1)
    y += drift * (0.25 + rand() * 0.55) * (0.35 + t * 0.65)
    y += (rand() - 0.5) * vol * 6
    const pull = Math.sin(t * Math.PI) * drift * 0.35
    y += pull
    y = Math.max(0.06, Math.min(0.94, y))
    pts.push(y)
  }
  return pts
}
