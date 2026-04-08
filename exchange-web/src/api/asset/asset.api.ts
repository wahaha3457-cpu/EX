import {
  getAssetsCenterAdminDomainMock,
  getAssetsCenterDomainMock,
} from '@/api/asset/asset.domainMock'
import { fetchLegacyAssetsCenterRaw } from '@/api/asset/legacy/legacyAssetsCenter'
import { isMockAdminSession } from '@/mocks/authMockService'
import { getAccessToken } from '@/utils/tokenStorage'
import { fetchExchangeSpotAssetsSpotRows } from '@/api/trade/exchangeSpot'
import { isExchangeSpotApiEnabled, isLegacyAuthMode, isMockMode } from '@/config/env'
import type { AssetsBalanceRowRaw, AssetsCenterPayloadRaw } from '@/api/asset/asset.types'
import type { AssetsCenterPayload } from '@/types/assetsCenter'

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function balanceToRaw(r: AssetsCenterPayload['balances']['overview'][0]): AssetsBalanceRowRaw {
  return {
    coin: r.asset,
    total: String(r.total),
    available: String(r.available),
    frozen: String(r.frozen),
    margin: r.marginOccupied == null ? null : String(r.marginOccupied),
    usdt_value: String(r.valueUsdt),
  }
}

/** 本地模拟：将「域模型」转为旧版 snake_case Raw（联调后改为 apiGet<AssetsCenterPayloadRaw>） */
export function assetsCenterDomainToRaw(p: AssetsCenterPayload): AssetsCenterPayloadRaw {
  return {
    overview: {
      total_usdt: String(p.overview.totalUsdt),
      today_pnl_usdt: String(p.overview.todayPnlUsdt ?? ''),
      today_pnl_pct: String(p.overview.todayPnlPct ?? ''),
      nft_estimated_usdt: String(p.overview.nftEstimatedUsdt ?? 0),
      nft_holdings_count: String(p.overview.nftHoldingsCount ?? 0),
      distribution: p.overview.distribution.map((d) => ({
        account: d.account,
        label: d.label,
        ratio: String(d.ratio),
        value_usdt: String(d.valueUsdt),
      })),
    },
    balances: {
      overview: p.balances.overview.map(balanceToRaw),
      spot: p.balances.spot.map(balanceToRaw),
      futures: p.balances.futures.map(balanceToRaw),
      funding: p.balances.funding.map(balanceToRaw),
    },
    records: {
      ledger: p.records.ledger.map((x) => ({
        id: x.id,
        time: x.time,
        type: x.type,
        coin: x.asset,
        amount: String(x.amount),
        balance_after: x.balanceAfter == null ? null : String(x.balanceAfter),
        remark: x.remark,
      })),
      deposits: p.records.deposits.map((x) => ({
        id: x.id,
        time: x.time,
        coin: x.asset,
        amount: String(x.amount),
        status: x.status,
        tx_id: x.txId,
        network: x.network,
      })),
      withdraws: p.records.withdraws.map((x) => ({
        id: x.id,
        time: x.time,
        coin: x.asset,
        amount: String(x.amount),
        fee: String(x.fee),
        status: x.status,
        address: x.address,
        network: x.network,
      })),
      transfers: p.records.transfers.map((x) => ({
        id: x.id,
        time: x.time,
        from_acct: x.from,
        to_acct: x.to,
        coin: x.asset,
        amount: String(x.amount),
        status: x.status,
      })),
    },
  }
}

export async function fetchAssetsCenterRaw(): Promise<AssetsCenterPayloadRaw> {
  await delay(40)
  if (isMockMode()) {
    const domain = isMockAdminSession(getAccessToken())
      ? getAssetsCenterAdminDomainMock()
      : getAssetsCenterDomainMock()
    return assetsCenterDomainToRaw(domain)
  }
  if (isLegacyAuthMode()) {
    return fetchLegacyAssetsCenterRaw()
  }
  const domain = isMockAdminSession(getAccessToken())
    ? getAssetsCenterAdminDomainMock()
    : getAssetsCenterDomainMock()
  let raw = assetsCenterDomainToRaw(domain)
  if (isExchangeSpotApiEnabled() && getAccessToken()) {
    try {
      const spot = await fetchExchangeSpotAssetsSpotRows()
      raw = {
        ...raw,
        balances: { ...raw.balances, spot },
      }
    } catch (e) {
      console.warn('[assets] 现货账户已切换为后端余额失败，保留演示现货表', e)
    }
  }
  return raw
}
