import type { NftListing, NftOrder, NftOwnership } from '@/types/nft'

const LS_KEY = 'ex:nft-lite-db:v1'

export const NFT_SELL_FEE_RATE = 0.02

export interface NftLiteDb {
  listings: NftListing[]
  ownerships: NftOwnership[]
  orders: NftOrder[]
  /** 仅用于演示多用户结算（非 UI 资产中心）；key = uid */
  usdtLedger: Record<string, number>
}

function nowIso() {
  return new Date().toISOString()
}

function uid(p: string) {
  return `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function readJson<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function loadNftLiteDb(): NftLiteDb {
  const d = readJson<NftLiteDb>(typeof localStorage !== 'undefined' ? localStorage.getItem(LS_KEY) : null)
  if (d?.listings && d.ownerships && d.orders && d.usdtLedger) return d
  return {
    listings: [],
    ownerships: [],
    orders: [],
    usdtLedger: {
      platform: 0,
      maker_1: 50_000,
      maker_2: 50_000,
      maker_3: 50_000,
    },
  }
}

export function saveNftLiteDb(db: NftLiteDb) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(LS_KEY, JSON.stringify(db))
}

export function ensureUserLedger(db: NftLiteDb, uid: string) {
  if (db.usdtLedger[uid] == null) db.usdtLedger[uid] = 0
}

/** 演示账本 USDT 余额（与 buyNft 结算同源，供 UI 展示） */
export function getDemoLedgerUsdt(uid: string): number {
  const db = loadNftLiteDb()
  const v = db.usdtLedger[uid]
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

export function createListing(db: NftLiteDb, params: { itemId: string; sellerUid: string; priceUsdt: number }) {
  const t = nowIso()
  const listing: NftListing = {
    id: uid('lst'),
    itemId: params.itemId,
    sellerUid: params.sellerUid,
    priceUsdt: params.priceUsdt,
    status: 'LISTED',
    createdAt: t,
    updatedAt: t,
  }
  db.listings.unshift(listing)
  return listing
}

export function createOwnership(
  db: NftLiteDb,
  params: { itemId: string; ownerUid: string; status: NftOwnership['status']; costUsdt: number },
) {
  const own: NftOwnership = {
    id: uid('own'),
    itemId: params.itemId,
    ownerUid: params.ownerUid,
    status: params.status,
    acquiredAt: nowIso(),
    costUsdt: params.costUsdt,
    listingId: null,
  }
  db.ownerships.unshift(own)
  return own
}

export function createOrder(
  db: NftLiteDb,
  params: {
    itemId: string
    itemTitle: string
    collectionName: string
    buyerUid: string
    sellerUid: string
    listingId: string
    priceUsdt: number
  },
): NftOrder {
  const feeUsdt = +(params.priceUsdt * NFT_SELL_FEE_RATE).toFixed(2)
  const sellerNetUsdt = +(params.priceUsdt - feeUsdt).toFixed(2)
  const ord: NftOrder = {
    id: uid('nord'),
    time: nowIso(),
    itemId: params.itemId,
    itemTitle: params.itemTitle,
    collectionName: params.collectionName,
    side: 'BUY',
    status: 'PENDING',
    priceUsdt: params.priceUsdt,
    feeRate: NFT_SELL_FEE_RATE,
    feeUsdt,
    sellerNetUsdt,
    buyerUid: params.buyerUid,
    sellerUid: params.sellerUid,
    listingId: params.listingId,
  }
  db.orders.unshift(ord)
  return ord
}

