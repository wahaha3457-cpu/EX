/**
 * VIP 等级规则（演示）：按近 30 日现货+合约折算交易量（USDT）分档，费率与币安式产品对齐为示意。
 * 生产环境应以服务端快照为准。
 */

import type { UserAccountTier } from '@/types/userCenter'

export interface VipTierRow {
  level: number
  /** 达到该等级所需的 30 日交易量下限（USDT） */
  min30dVolumeUsdt: number
  /** 挂单费率（基点，示意） */
  makerFeeBps: number
  /** 吃单费率（基点，示意） */
  takerFeeBps: number
}

/** 升序档位；有效等级 = 满足条件的最高 level */
export const VIP_TIER_TABLE: VipTierRow[] = [
  { level: 0, min30dVolumeUsdt: 0, makerFeeBps: 10, takerFeeBps: 10 },
  { level: 1, min30dVolumeUsdt: 50_000, makerFeeBps: 9, takerFeeBps: 10 },
  { level: 2, min30dVolumeUsdt: 500_000, makerFeeBps: 8, takerFeeBps: 9 },
  { level: 3, min30dVolumeUsdt: 2_000_000, makerFeeBps: 7, takerFeeBps: 9 },
  { level: 4, min30dVolumeUsdt: 10_000_000, makerFeeBps: 6, takerFeeBps: 8 },
  { level: 5, min30dVolumeUsdt: 50_000_000, makerFeeBps: 5, takerFeeBps: 8 },
  { level: 6, min30dVolumeUsdt: 200_000_000, makerFeeBps: 4, takerFeeBps: 7 },
  { level: 7, min30dVolumeUsdt: 500_000_000, makerFeeBps: 3, takerFeeBps: 7 },
  { level: 8, min30dVolumeUsdt: 1_000_000_000, makerFeeBps: 2, takerFeeBps: 6 },
  { level: 9, min30dVolumeUsdt: 2_500_000_000, makerFeeBps: 1, takerFeeBps: 5 },
]

/** 由交易量得到 VIP 等级（不含账户人工档位保底） */
export function vipLevelFrom30dVolume(volumeUsdt: number): number {
  let best = 0
  for (const row of VIP_TIER_TABLE) {
    if (volumeUsdt >= row.min30dVolumeUsdt) best = row.level
  }
  return best
}

/** 服务端账户档位对应的 VIP 下限（人工调级 / 活动授予） */
export function vipFloorFromAccountTier(tier: UserAccountTier): number {
  if (tier === 'VIP1') return 1
  if (tier === 'VIP2') return 2
  if (tier === 'VIP3') return 3
  return 0
}

/** 演示：未写入本地交易量时，按账户标签给一个合理的默认估算量 */
export function defaultDemo30dVolumeForTier(tier: UserAccountTier): number {
  if (tier === 'VIP3') return 30_000_000
  if (tier === 'VIP2') return 3_000_000
  if (tier === 'VIP1') return 400_000
  return 35_000
}

export function formatVolUsdt(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(Math.round(n))
}

export function nextTierInfo(currentLevel: number): VipTierRow | null {
  const next = VIP_TIER_TABLE.find((r) => r.level === currentLevel + 1)
  return next ?? null
}
