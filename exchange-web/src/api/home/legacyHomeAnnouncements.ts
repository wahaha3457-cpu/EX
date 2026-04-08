import { legacyTryGet } from '@/api/auth/legacy/legacyHttp'
import type { HomeAnnouncementItem, HomeFeedKind } from '@/types/home'

const NOTICE_LIST_PATH = import.meta.env.VITE_LEGACY_NOTICE_LIST_PATH || '/api/notice/list'

function asRec(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function kindFrom(s: string): HomeFeedKind {
  const t = s.toLowerCase()
  if (t.includes('活动')) return 'activity'
  if (t.includes('维护') || t.includes('升级')) return 'maintenance'
  return 'announcement'
}

/**
 * H5 通知列表（Swagger：`GET /api/notice/list`，需 current、size）
 */
export async function fetchLegacyHomeAnnouncements(): Promise<HomeAnnouncementItem[]> {
  const data = await legacyTryGet<unknown>(NOTICE_LIST_PATH, {
    current: 1,
    size: 8,
  })
  if (data == null) return []
  const rows = asRec(data)?.records ?? asRec(data)?.list ?? (Array.isArray(data) ? data : [])
  if (!Array.isArray(rows)) return []
  const out: HomeAnnouncementItem[] = []
  let i = 0
  for (const item of rows) {
    const r = asRec(item)
    if (!r) continue
    const title = String(r.title ?? r.name ?? r.content ?? r.msg ?? '').trim()
    if (!title) continue
    const id = String(r.id ?? r.uuid ?? `n-${i++}`)
    const publishedAt = String(r.createTime ?? r.publishTime ?? r.time ?? '').slice(0, 10) || '—'
    const typeStr = String(r.type ?? r.category ?? '')
    out.push({
      id,
      title: title.length > 80 ? `${title.slice(0, 80)}…` : title,
      publishedAt,
      kind: kindFrom(typeStr),
      tag: typeStr || '公告',
    })
  }
  return out.slice(0, 8)
}
