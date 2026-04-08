import { isMockMode } from '@/config/env'
import { fetchCoindeskRssArticles } from '@/api/news/coindeskRss'
import { fetchMockNewsArticles } from '@/api/news/newsMock'

export { coverForArticle } from '@/api/news/articleDisplay'

/**
 * 全球资讯列表。
 * - `VITE_USE_MOCK=true` 或 `VITE_NEWS_FEED=mock`：本地演示稿
 * - 否则优先拉取外部资讯聚合源，失败则回退演示数据
 */
export async function fetchNewsArticles() {
  if (isMockMode() || import.meta.env.VITE_NEWS_FEED === 'mock') {
    return fetchMockNewsArticles()
  }
  try {
    const rows = await fetchCoindeskRssArticles()
    if (rows.length > 0) return rows
  } catch (e) {
    console.warn('[news] 资讯聚合源不可用，使用本地演示数据', e)
  }
  return fetchMockNewsArticles()
}
