import type { NftItem, NftListing, NftMarketRow, NftOrder, NftOwnership, NftUserHolding } from '@/types/nft'
import { NFT_ITEMS } from '@/api/nft/nftMock'
import {
  createListing,
  createOrder,
  ensureUserLedger,
  loadNftLiteDb,
  saveNftLiteDb,
  type NftLiteDb,
} from '@/api/nft/nftLiteDb'

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function isFinitePos(n: number) {
  return Number.isFinite(n) && n > 0
}

function findItem(itemId: string): NftItem | null {
  return NFT_ITEMS.find((x) => x.id === itemId) ?? null
}

/** 资产中心 · 资金账户 USDT 可用（与理财/NFT 说明一致，可支付 NFT） */
async function getFundingUsdtAvailable(): Promise<number> {
  try {
    const { useAssetsCenterStore } = await import('@/stores/assetsCenter')
    const ac = useAssetsCenterStore()
    if (!ac.payload) {
      await ac.bootstrap()
    }
    const rows = ac.payload?.balances.funding
    if (!rows?.length) return 0
    return rows.find((r) => r.asset === 'USDT')?.available ?? 0
  } catch {
    return 0
  }
}

/**
 * 买方支付：先扣 NFT 演示账本，不足部分从资金账户 USDT 扣（与资产中心同源）。
 * 需在 createOrder 之前调用，失败则不落单。
 */
async function settleBuyerPayment(db: NftLiteDb, buyerUid: string, need: number): Promise<boolean> {
  ensureUserLedger(db, buyerUid)
  const led = db.usdtLedger[buyerUid] ?? 0
  const fundU = await getFundingUsdtAvailable()
  if (led + fundU < need - 1e-9) return false

  const takeLed = Math.min(led, need)
  db.usdtLedger[buyerUid] = round2(led - takeLed)
  const fromFunding = need - takeLed
  if (fromFunding > 1e-9) {
    try {
      const { useAssetsCenterStore } = await import('@/stores/assetsCenter')
      const ac = useAssetsCenterStore()
      if (!ac.payload) await ac.bootstrap()
      ac.adjustWalletBalance('funding', 'USDT', -fromFunding, -fromFunding)
    } catch {
      db.usdtLedger[buyerUid] = round2(led)
      return false
    }
  }
  return true
}

export async function fetchNftMarketplace(params?: {
  q?: string
  sort?: 'latest' | 'price_asc' | 'price_desc' | 'popular'
}): Promise<{ rows: NftMarketRow[] }> {
  await delay(160)
  const db = loadNftLiteDb()
  const q = (params?.q ?? '').trim().toLowerCase()

  let listings = db.listings.filter((l) => l.status === 'LISTED')
  if (q) {
    listings = listings.filter((l) => {
      const it = findItem(l.itemId)
      if (!it) return false
      return (
        it.title.toLowerCase().includes(q) ||
        it.collectionName.toLowerCase().includes(q) ||
        it.creator.toLowerCase().includes(q)
      )
    })
  }

  const rows: NftMarketRow[] = listings
    .map((l) => {
      const item = findItem(l.itemId)
      if (!item) return null
      return { item, listing: l }
    })
    .filter(Boolean) as NftMarketRow[]

  const sort = params?.sort ?? 'latest'
  if (sort === 'price_asc') rows.sort((a, b) => a.listing.priceUsdt - b.listing.priceUsdt)
  else if (sort === 'price_desc') rows.sort((a, b) => b.listing.priceUsdt - a.listing.priceUsdt)
  else rows.sort((a, b) => b.listing.createdAt.localeCompare(a.listing.createdAt))

  return { rows }
}

export async function fetchMyNft(uid: string): Promise<{ holdings: NftUserHolding[]; orders: NftOrder[] }> {
  await delay(160)
  const db = loadNftLiteDb()
  const owns = db.ownerships.filter((o) => o.ownerUid === uid)
  const holdings: NftUserHolding[] = owns
    .map((o) => {
      const item = findItem(o.itemId)
      if (!item) return null
      const listing = o.listingId ? db.listings.find((l) => l.id === o.listingId) ?? null : null
      return { ownership: o, item, listing }
    })
    .filter(Boolean) as NftUserHolding[]

  const orders = db.orders.filter((x) => x.buyerUid === uid || x.sellerUid === uid)
  return { holdings, orders }
}

export async function listMyNft(params: {
  uid: string
  itemId: string
  priceUsdt: number
}): Promise<{ ok: true; listing: NftListing } | { ok: false; code: string }> {
  await delay(240)
  const db = loadNftLiteDb()
  const p = round2(params.priceUsdt)
  if (!isFinitePos(p) || p < 1) return { ok: false, code: 'price' }

  const own = db.ownerships.find((o) => o.ownerUid === params.uid && o.itemId === params.itemId)
  if (!own) return { ok: false, code: 'not_owned' }
  if (own.status === 'FROZEN') return { ok: false, code: 'frozen' }
  if (own.status === 'LISTED' || own.listingId) return { ok: false, code: 'already_listed' }

  const listing = createListing(db, { itemId: params.itemId, sellerUid: params.uid, priceUsdt: p })
  own.status = 'LISTED'
  own.listingId = listing.id
  saveNftLiteDb(db)
  return { ok: true, listing }
}

export async function delistMyNft(params: {
  uid: string
  listingId: string
}): Promise<{ ok: true } | { ok: false; code: string }> {
  await delay(180)
  const db = loadNftLiteDb()
  const listing = db.listings.find((l) => l.id === params.listingId)
  if (!listing) return { ok: false, code: 'not_found' }
  if (listing.sellerUid !== params.uid) return { ok: false, code: 'forbidden' }
  if (listing.status !== 'LISTED') return { ok: false, code: 'not_listed' }

  listing.status = 'DELISTED'
  listing.updatedAt = new Date().toISOString()
  const own = db.ownerships.find((o) => o.ownerUid === params.uid && o.listingId === listing.id)
  if (own) {
    own.status = 'OWNED'
    own.listingId = null
  }
  saveNftLiteDb(db)
  return { ok: true }
}

export async function buyNft(params: {
  buyerUid: string
  listingId: string
}): Promise<{ ok: true; order: NftOrder; sellerNetUsdt: number; feeUsdt: number } | { ok: false; code: string }> {
  await delay(420)
  const db = loadNftLiteDb()
  ensureUserLedger(db, params.buyerUid)
  const listing = db.listings.find((l) => l.id === params.listingId)
  if (!listing) return { ok: false, code: 'not_found' }
  if (listing.status !== 'LISTED') return { ok: false, code: 'not_listed' }
  if (listing.sellerUid === params.buyerUid) return { ok: false, code: 'self' }

  const item = findItem(listing.itemId)
  if (!item) return { ok: false, code: 'item' }

  const sellerOwn = db.ownerships.find((o) => o.itemId === listing.itemId && o.ownerUid === listing.sellerUid)
  if (!sellerOwn) return { ok: false, code: 'seller_own_missing' }
  if (sellerOwn.status === 'FROZEN') return { ok: false, code: 'frozen' }

  const need = listing.priceUsdt
  const paid = await settleBuyerPayment(db, params.buyerUid, need)
  if (!paid) return { ok: false, code: 'funds' }

  const ord = createOrder(db, {
    itemId: item.id,
    itemTitle: item.title,
    collectionName: item.collectionName,
    buyerUid: params.buyerUid,
    sellerUid: listing.sellerUid,
    listingId: listing.id,
    priceUsdt: listing.priceUsdt,
  })

  // 买方扣款已在 settleBuyerPayment 完成；以下为卖方入账（仅收卖方手续费）
  ensureUserLedger(db, listing.sellerUid)
  db.usdtLedger[listing.sellerUid] = round2((db.usdtLedger[listing.sellerUid] ?? 0) + ord.sellerNetUsdt)
  ensureUserLedger(db, 'platform')
  db.usdtLedger['platform'] = round2((db.usdtLedger['platform'] ?? 0) + ord.feeUsdt)

  // 归属转移
  listing.status = 'SOLD'
  listing.updatedAt = new Date().toISOString()

  sellerOwn.status = 'SOLD'
  sellerOwn.listingId = null

  const buyerOwn: NftOwnership = {
    id: `own-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    itemId: item.id,
    ownerUid: params.buyerUid,
    status: 'OWNED',
    acquiredAt: new Date().toISOString(),
    costUsdt: listing.priceUsdt,
    listingId: null,
  }
  db.ownerships.unshift(buyerOwn)

  ord.status = 'COMPLETED'
  saveNftLiteDb(db)
  return { ok: true, order: ord, sellerNetUsdt: ord.sellerNetUsdt, feeUsdt: ord.feeUsdt }
}

/**
 * 初始化演示市场：给若干 maker 预置持仓与挂单（只在 db 为空时执行）
 */
export async function ensureNftLiteSeed() {
  const db = loadNftLiteDb()
  if (db.ownerships.length || db.listings.length) return
  const makers = ['maker_1', 'maker_2', 'maker_3']
  const picked = NFT_ITEMS.slice(0, 18)
  for (let i = 0; i < picked.length; i++) {
    const it = picked[i]!
    const sellerUid = makers[i % makers.length]!
    const own: NftOwnership = {
      id: `own-seed-${it.id}`,
      itemId: it.id,
      ownerUid: sellerUid,
      status: 'OWNED',
      acquiredAt: new Date(Date.now() - 86400_000 * (2 + (i % 12))).toISOString(),
      costUsdt: 80 + i * 12,
      listingId: null,
    }
    db.ownerships.push(own)
    const listing = createListing(db, { itemId: it.id, sellerUid, priceUsdt: 120 + i * 15 })
    own.status = 'LISTED'
    own.listingId = listing.id
  }
  saveNftLiteDb(db)
}

