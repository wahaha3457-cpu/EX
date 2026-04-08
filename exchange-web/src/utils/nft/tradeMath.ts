import type { NftChain, NftItem } from '@/types/nft'

/** 演示：各链单笔合约交互 Gas 估算（原生币） */
export const NFT_DEMO_GAS_NATIVE: Record<NftChain, number> = {
  BSC: 0.00075,
  ETH: 0.0028,
  POLYGON: 0.015,
}

export function auctionStepEth(it: NftItem): number {
  if (it.auctionStepEth != null) return it.auctionStepEth
  return Math.max(0.001, Number((it.priceEth * 0.01).toFixed(6)))
}

/** 下一口最低出价（当前最高价 + 加价步长） */
export function minNextBidEth(it: NftItem): number {
  return it.priceEth + auctionStepEth(it)
}

export function gasEstimateNative(chain: NftChain): number {
  return NFT_DEMO_GAS_NATIVE[chain]
}
