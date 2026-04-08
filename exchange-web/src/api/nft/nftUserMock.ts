import type { NftUserHolding, NftUserOrderRecord } from '@/types/nft'

/**
 * 演示：用户 NFT 持有与订单（与 nftMock 无强制关联，仅供订单中心展示）
 */
export async function fetchNftUserPortfolio(): Promise<{
  holdings: NftUserHolding[]
  orders: NftUserOrderRecord[]
}> {
  await new Promise((r) => setTimeout(r, 280))
  const holdings: NftUserHolding[] = [
    {
      id: 'hld-1',
      itemId: 'nft-101',
      title: 'Lunar Drift #12',
      collectionName: 'Lunar Drift',
      chain: 'BSC',
      imageSeed: 'nft-hld-1',
      acquiredAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      costUsdt: 128.5,
    },
    {
      id: 'hld-2',
      itemId: 'nft-205',
      title: 'Neon Glyph #03',
      collectionName: 'Neon City',
      chain: 'ETH',
      imageSeed: 'nft-hld-2',
      acquiredAt: new Date(Date.now() - 86400000 * 18).toISOString(),
      costUsdt: 890,
    },
  ]

  const orders: NftUserOrderRecord[] = [
    {
      id: 'ord-1',
      time: new Date(Date.now() - 86400000 * 4).toISOString(),
      itemTitle: 'Lunar Drift #12',
      collectionName: 'Lunar Drift',
      chain: 'BSC',
      side: 'BUY',
      kind: 'BUY_NOW',
      amountEth: 0.042,
      amountUsdt: 128.5,
      status: 'FILLED',
    },
    {
      id: 'ord-2',
      time: new Date(Date.now() - 86400000 * 6).toISOString(),
      itemTitle: 'Zen Garden #88',
      collectionName: 'Zen Garden',
      chain: 'POLYGON',
      side: 'BID',
      kind: 'AUCTION_BID',
      amountEth: 0.31,
      amountUsdt: 720,
      status: 'OUTBID',
    },
    {
      id: 'ord-3',
      time: new Date(Date.now() - 3600000 * 2).toISOString(),
      itemTitle: 'Pixel Punk #404',
      collectionName: 'Pixel Punks',
      chain: 'ETH',
      side: 'BID',
      kind: 'AUCTION_BID',
      amountEth: 0.55,
      amountUsdt: 1320,
      status: 'PENDING',
    },
    {
      id: 'ord-4',
      time: new Date(Date.now() - 86400000 * 20).toISOString(),
      itemTitle: 'Orbit Key #01',
      collectionName: 'Orbit Keys',
      chain: 'BSC',
      side: 'SELL',
      kind: 'BUY_NOW',
      amountEth: 0.18,
      amountUsdt: 560,
      status: 'FILLED',
    },
  ]

  return { holdings, orders }
}
