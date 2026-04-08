import { apiGet } from '@/api/common/http'
import { fetchLegacyHomeAnnouncements } from '@/api/home/legacyHomeAnnouncements'
import { buildHomeOverviewFromMarketRows } from '@/api/home/overviewFromMarket'
import { getHomeOverviewMock } from '@/api/mock/homeOverviewMock'
import { fetchMarketTickers } from '@/api/market'
import { isLegacyAuthMode, isMockMode } from '@/config/env'
import type { HomeOverviewPayload } from '@/types/home'

/**
 * 首页聚合：
 * - Mock：本地假数据
 * - Legacy：行情列表（与行情中心同源）+ 可选 `/api/notice/list` 公告
 * - 默认：GET `/v1/home/overview`；失败则尝试 `/v1/market/tickers` 聚合
 */
export async function fetchHomeOverview(): Promise<HomeOverviewPayload> {
  if (isMockMode()) {
    return getHomeOverviewMock()
  }
  if (isLegacyAuthMode()) {
    const [tickers, announcements] = await Promise.all([
      fetchMarketTickers(),
      fetchLegacyHomeAnnouncements().catch(() => [] as HomeOverviewPayload['announcements']),
    ])
    return buildHomeOverviewFromMarketRows(tickers, announcements)
  }
  try {
    return await apiGet<HomeOverviewPayload>('/v1/home/overview')
  } catch {
    try {
      const tickers = await fetchMarketTickers()
      return buildHomeOverviewFromMarketRows(tickers, [])
    } catch {
      return buildHomeOverviewFromMarketRows([], [])
    }
  }
}
