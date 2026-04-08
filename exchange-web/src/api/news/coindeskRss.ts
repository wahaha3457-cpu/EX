/**
 * 公开资讯 RSS syndication（开发走同源 `/coindesk-rss` 代理；生产请在网关转发或配置 VITE_COINDESK_RSS_URL）。
 */
import type { NewsArticleMeta, NewsCategory } from '@/types/news'

const MEDIA_NS = 'http://search.yahoo.com/mrss/'
const CONTENT_NS = 'http://purl.org/rss/1.0/modules/content/'

function rssFetchUrl(): string {
  const custom = import.meta.env.VITE_COINDESK_RSS_URL as string | undefined
  if (custom && custom.length > 0) return custom
  if (import.meta.env.DEV) return '/coindesk-rss'
  return '/coindesk-rss'
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function mapRssCategory(raw: string): NewsCategory {
  const u = raw.trim().toLowerCase()
  if (u.includes('policy') || u.includes('regulation') || u.includes('legal')) return 'REGULATION'
  if (u.includes('market')) return 'MARKETS'
  if (u.includes('tech') || u.includes('protocol')) return 'PRODUCT'
  if (u.includes('opinion') || u.includes('learn') || u.includes('consensus')) return 'DEPTH'
  if (u.includes('finance') || u.includes('macro') || u.includes('fed')) return 'MACRO'
  if (u.includes('business')) return 'MARKETS'
  return 'MARKETS'
}

function pickCategories(item: Element): string[] {
  const out: string[] = []
  item.querySelectorAll('category').forEach((el) => {
    const t = el.textContent?.trim()
    if (t && t !== 'News') out.push(t)
  })
  return out
}

function estimateReadMin(text: string): number {
  const words = stripHtml(text).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.min(12, Math.round(words / 220) || 1))
}

function guidSlug(guid: string, link: string): string {
  const g = guid.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 36)
  if (g.length >= 8) return `cd-${g}`
  let h = 0
  for (let i = 0; i < link.length; i++) h = (Math.imul(31, h) + link.charCodeAt(i)) | 0
  return `cd-${Math.abs(h).toString(16)}`
}

export async function fetchCoindeskRssArticles(limit = 45): Promise<NewsArticleMeta[]> {
  const url = rssFetchUrl()
  const res = await fetch(url, { credentials: 'omit' })
  if (!res.ok) throw new Error(`资讯 RSS HTTP ${res.status}`)
  const xml = await res.text()
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  const parseErr = doc.querySelector('parsererror')
  if (parseErr) throw new Error('资讯 RSS XML 解析失败')

  const items = Array.from(doc.querySelectorAll('channel > item'))
  const out: NewsArticleMeta[] = []

  items.slice(0, limit).forEach((el, idx) => {
    const title = el.querySelector('title')?.textContent?.trim() ?? ''
    const link = el.querySelector('link')?.textContent?.trim() ?? ''
    const pub = el.querySelector('pubDate')?.textContent?.trim() ?? ''
    const descRaw = el.querySelector('description')?.textContent?.trim() ?? ''
    const guid = el.querySelector('guid')?.textContent?.trim() ?? link
    if (!title || !link) return

    const media = el.getElementsByTagNameNS(MEDIA_NS, 'content')[0]
    const imageUrl = media?.getAttribute('url')?.replace(/&amp;/g, '&') ?? undefined

    const cats = pickCategories(el)
    const section = cats[0] ?? 'Markets'
    let category = mapRssCategory(section)
    const summary = stripHtml(descRaw)
    const summaryShort = summary.slice(0, 420)
    const fullText = summary.length > 0 ? summary : summaryShort

    if (summary.length < 220 && title.length < 100) {
      category = 'FLASH'
    }

    const publishedAt = (() => {
      const t = Date.parse(pub)
      return Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString()
    })()

    const slug = guidSlug(guid, link)
    const readMin = estimateReadMin(`${title} ${fullText}`)

    out.push({
      slug,
      category,
      publishedAt,
      coverSeed: `cd-${slug}`,
      readMin,
      featured: idx < 3,
      views: Math.max(800, 48_000 - idx * 900),
      external: {
        title,
        summary: summaryShort,
        fullText,
        url: link,
        imageUrl,
      },
    })
  })

  return out
}
