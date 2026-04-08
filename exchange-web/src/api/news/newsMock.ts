import type { NewsArticleMeta } from '@/types/news'

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export function coverUrl(seed: string, w = 640, h = 360) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`
}

const ARTICLES: NewsArticleMeta[] = [
  {
    slug: 'eth-etf-institutional',
    category: 'MARKETS',
    publishedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    coverSeed: 'news-eth-etf',
    readMin: 4,
    featured: true,
    views: 128_400,
  },
  {
    slug: 'btc-halving-liquidity',
    category: 'DEPTH',
    publishedAt: new Date(Date.now() - 8 * 3600_000).toISOString(),
    coverSeed: 'news-btc-halving',
    readMin: 6,
    featured: true,
    views: 96_200,
  },
  {
    slug: 'stablecoin-mica',
    category: 'REGULATION',
    publishedAt: new Date(Date.now() - 20 * 3600_000).toISOString(),
    coverSeed: 'news-stable-mica',
    readMin: 5,
    featured: false,
    views: 54_800,
  },
  {
    slug: 'layer2-dencun',
    category: 'PRODUCT',
    publishedAt: new Date(Date.now() - 26 * 3600_000).toISOString(),
    coverSeed: 'news-layer2',
    readMin: 5,
    featured: true,
    views: 71_300,
  },
  {
    slug: 'exchange-proof-reserves',
    category: 'PRODUCT',
    publishedAt: new Date(Date.now() - 40 * 3600_000).toISOString(),
    coverSeed: 'news-por',
    readMin: 4,
    featured: false,
    views: 42_100,
  },
  {
    slug: 'macro-fed-watch',
    category: 'MACRO',
    publishedAt: new Date(Date.now() - 50 * 3600_000).toISOString(),
    coverSeed: 'news-macro-fed',
    readMin: 5,
    featured: false,
    views: 88_900,
  },
  {
    slug: 'flash-etf-net',
    category: 'FLASH',
    publishedAt: new Date(Date.now() - 0.5 * 3600_000).toISOString(),
    coverSeed: 'news-flash-etf',
    readMin: 1,
    featured: false,
    views: 210_000,
  },
  {
    slug: 'flash-sec-crypto',
    category: 'FLASH',
    publishedAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
    coverSeed: 'news-flash-sec',
    readMin: 1,
    featured: false,
    views: 156_000,
  },
]

export async function fetchMockNewsArticles(): Promise<NewsArticleMeta[]> {
  await delay(180)
  return [...ARTICLES].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

/** @deprecated 请使用 `@/api/news` 的 fetchNewsArticles */
export async function fetchNewsArticles(): Promise<NewsArticleMeta[]> {
  return fetchMockNewsArticles()
}

export function getArticleBySlug(slug: string): NewsArticleMeta | undefined {
  return ARTICLES.find((a) => a.slug === slug)
}
