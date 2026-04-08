import type { NewsArticleMeta } from '@/types/news'
import { coverUrl } from '@/api/news/newsMock'

export function coverForArticle(m: NewsArticleMeta, w = 640, h = 360): string {
  const u = m.external?.imageUrl
  if (u && /^https?:\/\//i.test(u)) return u
  return coverUrl(m.coverSeed, w, h)
}
