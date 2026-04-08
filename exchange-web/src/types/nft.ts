/**
 * NFT Marketplace Lite（可上线最小闭环）
 * - 站内托管式：平台内部账本记录所有权与资金变更
 * - 固定价格：只支持一口价上架 / 一口价购买（USDT）
 * - 简化状态：足够支撑持有/挂单/成交/下架/冻结与订单记录追踪
 */

export type NftChain = 'BSC' | 'ETH' | 'POLYGON'

export type NftCategory = 'PFP' | 'ART' | 'GAME' | 'SPORT' | 'METAVERSE'

export type NftSort = 'latest' | 'price_asc' | 'price_desc' | 'popular'

export interface NftTrait {
  traitType: string
  value: string
}

export interface NftItem {
  id: string
  slug: string
  title: string
  collectionId: string
  collectionName: string
  imageSeed: string
  chain: NftChain
  category: NftCategory
  verified: boolean
  creator: string
  description: string
  traits: NftTrait[]
}

export interface NftCollection {
  id: string
  slug: string
  name: string
  coverSeed: string
  chain: NftChain
  items: number
  verified: boolean
}

export interface NftMarketStats {
  volume24hUsdt: number
  traders24h: number
  listed: number
}

export type NftAssetStatus = 'OWNED' | 'LISTED' | 'SOLD' | 'DELISTED' | 'FROZEN'

export type NftListingStatus = 'LISTED' | 'DELISTED' | 'SOLD'

export type NftOrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'FAILED'

export interface NftListing {
  id: string
  itemId: string
  sellerUid: string
  priceUsdt: number
  status: NftListingStatus
  createdAt: string
  updatedAt: string
}

export interface NftOwnership {
  id: string
  itemId: string
  ownerUid: string
  status: NftAssetStatus
  acquiredAt: string
  costUsdt: number
  listingId: string | null
}

export interface NftOrder {
  id: string
  time: string
  itemId: string
  itemTitle: string
  collectionName: string
  side: 'BUY' | 'SELL'
  status: NftOrderStatus
  /** 成交价（USDT） */
  priceUsdt: number
  /** 仅收卖方手续费（默认） */
  feeRate: number
  feeUsdt: number
  sellerNetUsdt: number
  buyerUid: string
  sellerUid: string
  listingId: string
}

/** 市场列表展示（item + 当前挂单） */
export interface NftMarketRow {
  item: NftItem
  listing: NftListing
}

/** 用户持有（我的 NFT / NFT 账户） */
export interface NftUserHolding {
  ownership: NftOwnership
  item: NftItem
  /** 当前挂单（若 LISTED） */
  listing: NftListing | null
}
