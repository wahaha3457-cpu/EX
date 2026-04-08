/** 迷你火花图：确定性点列 + 平滑曲线（无真实 K 线数据时的占位走势） */

export interface SparkPoint {
  x: number
  y: number
}

/** FNV-1a 32-bit，用于由字符串得到稳定 seed */
export function hashStringFnv1a(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export interface BuildSparkPointsOptions {
  /** 曲线宽度（viewBox 单位） */
  width: number
  /** 曲线高度（viewBox 单位） */
  height: number
  /** 24h 涨跌幅 0~1 */
  changePct: number
  /** 稳定随机种子 */
  seed: number
  /** 采样点数，越多越顺 */
  count?: number
  /** 上下留白 */
  padY?: number
}

/** 单拍心电图简化波形，u∈[0,1) 为心动周期内相位；返回值：向下为正，故 R 向上为负 */
function ecgBeatOffset(u: number, rSharpness: number): number {
  const uu = u % 1
  let v = 0

  // 低频基线微漂移（监护仪感）
  v += 0.04 * Math.sin(uu * Math.PI * 2 * 1.15)

  // P 波：圆隆小鼓包
  if (uu > 0.06 && uu < 0.14) {
    const pu = (uu - 0.06) / 0.08
    v += 0.07 * Math.sin(pu * Math.PI)
  }

  // Q：浅向下弯
  if (uu > 0.15 && uu < 0.2) {
    const qu = (uu - 0.15) / 0.05
    v += 0.11 * Math.sin(qu * Math.PI) * 0.55
  }

  // R：窄而高的向上尖峰（y 减小）
  const rC = 0.212 + rSharpness * 0.012
  const rSigma = 0.022 + rSharpness * 0.004
  v -= 1.05 * Math.exp(-Math.pow((uu - rC) / rSigma, 2))

  // S：R 后小洼
  if (uu > 0.26 && uu < 0.34) {
    const su = (uu - 0.26) / 0.08
    v += 0.12 * Math.sin(su * Math.PI) * 0.65
  }

  // T：宽圆丘（略向上）
  if (uu > 0.4 && uu < 0.9) {
    const tu = (uu - 0.4) / 0.5
    v -= 0.11 * Math.sin(tu * Math.PI)
  }

  // 极弱肌电感震颤（略作消减以免锯齿）
  v += 0.018 * Math.sin(uu * Math.PI * 48)

  return v
}

/**
 * 生成采样点：心率监护仪式起伏（多拍 QRS + 顺滑贝塞尔后续处理）
 * y 向下为正，适合 SVG
 */
export function buildSparkPoints(opts: BuildSparkPointsOptions): SparkPoint[] {
  const {
    width,
    height,
    changePct,
    seed,
    count = 32,
    padY = 4,
  } = opts

  /** 不修改调用方前提下保证足够细腻 */
  const n = Math.max(count, 46)
  const yMin = padY
  const yMax = height - padY
  const mid = (yMin + yMax) / 2
  const usable = yMax - yMin

  const seeded = seed + seed * 0x9e3779b9
  const numBeats = 3.65 + (seeded % 13) * 0.11
  const rJit = ((seeded >>> 8) % 7) * 0.01
  const phase0 = (seeded % 1000) * 0.001 * Math.PI

  const trend =
    changePct > 0.02
      ? -0.9
      : changePct < -0.02
        ? 0.9
        : changePct * 38

  const raw: number[] = []
  for (let i = 0; i < n; i++) {
    const t = n <= 1 ? 0 : i / (n - 1)
    const beatPhase = t * numBeats + phase0 * 0.02
    let off = ecgBeatOffset(beatPhase, rJit)

    off -= trend * (t - 0.5) * 0.06

    const breath = 0.06 * Math.sin(t * Math.PI * 3.2 + phase0)
    off += breath

    raw.push(off)
  }

  let mn = raw[0]!
  let mx = raw[0]!
  for (const v of raw) {
    if (v < mn) mn = v
    if (v > mx) mx = v
  }
  const span = Math.max(mx - mn, 1e-3)
  const targetSpan = usable * 0.78
  const scale = targetSpan / span
  const center = (mn + mx) / 2

  const pts: SparkPoint[] = []
  for (let i = 0; i < n; i++) {
    let y = mid + (raw[i]! - center) * scale
    y = Math.max(yMin, Math.min(yMax, y))
    pts.push({ x: (i / (n - 1)) * width, y })
  }

  if (changePct > 0.045 && pts.length > 1) {
    const last = pts[pts.length - 1]!
    const edge = Math.max(yMin, last.y - usable * 0.04)
    pts[pts.length - 1] = { x: last.x, y: edge }
  }
  if (changePct < -0.045 && pts.length > 1) {
    const last = pts[pts.length - 1]!
    pts[pts.length - 1] = { x: last.x, y: Math.min(yMax, last.y + usable * 0.04) }
  }

  return pts
}

/**
 * Catmull-Rom → SVG 三次贝塞尔，端点自动夹持
 */
export function pointsToSmoothPath(points: SparkPoint[]): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`
  let d = `M ${points[0]!.x} ${points[0]!.y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = points[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }
  return d
}

/** 面积：平滑底边闭合到底部 */
export function pointsToAreaPath(points: SparkPoint[], bottomY: number): string {
  const line = pointsToSmoothPath(points)
  if (!line) return ''
  const last = points[points.length - 1]!
  const first = points[0]!
  return `${line} L ${last.x},${bottomY} L ${first.x},${bottomY} Z`
}

export type SparkTone = 'up' | 'down' | 'flat'

export function sparkToneFromChangePct(changePct: number): SparkTone {
  if (changePct > 0.02) return 'up'
  if (changePct < -0.02) return 'down'
  return 'flat'
}
