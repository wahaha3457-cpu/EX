/** 全球资讯（演示域模型，对标交易所资讯 / 快讯频道） */

export type NewsCategory = 'FLASH' | 'MARKETS' | 'REGULATION' | 'PRODUCT' | 'DEPTH' | 'MACRO'

export type NewsSegment = 'featured' | 'all' | 'flash'

export interface NewsArticleMeta {
  slug: string
  category: NewsCategory
  publishedAt: string
  /** 封面占位图 seed（无外链图时使用） */
  coverSeed: string
  readMin: number
  featured: boolean
  views: number
  /**
   * 聚合资讯稿：标题/摘要/封面与正文由数据源同步，站内统一版式展示；`url` 仅保留于数据层供运维/对账，前端不展示。
   */
  external?: {
    title: string
    summary: string
    /** description / content:encoded 去 HTML 后的完整可读文本 */
    fullText?: string
    /** 数据层保留，不向用户暴露 */
    url: string
    imageUrl?: string
  }
}
