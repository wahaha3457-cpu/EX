<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useAuthStore } from '@/stores/auth'
import { useCopyTradingStore } from '@/stores/copyTrading'
import { formatPrice } from '@/utils/format/number'
import { formatCompact } from '@/utils/format'
import type { CopyFollowSettings, CopyMarket, LeadTrader } from '@/types/copyTrading'
import ExPageState from '@/components/common/ExPageState.vue'
import CopyFollowSettingsModal from '@/components/business/copyTrading/CopyFollowSettingsModal.vue'
import CopyTraderProfileModal from '@/components/business/copyTrading/CopyTraderProfileModal.vue'

const store = useCopyTradingStore()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const {
  leaders,
  filteredLeaders,
  loadingLeaders,
  leadersError,
  loadingMine,
  mineError,
  mainTab,
  marketFilter,
  riskFilter,
  sortKey,
  searchQuery,
  subscriptions,
  positions,
  history,
  totalUnrealizedUsdt,
  activeSubscriptions,
} = storeToRefs(store)

const settingsOpen = ref(false)
const settingsTrader = ref<LeadTrader | null>(null)
const settingsInitial = ref<Partial<CopyFollowSettings> | null>(null)
const settingsEdit = ref(false)
const expandedTraderId = ref<string | null>(null)
const profileOpen = ref(false)
const profileTrader = ref<LeadTrader | null>(null)
const plazaView = ref<'grid' | 'table'>('grid')

let posTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  void store.bootstrapLeaders()
  const q = route.query.tab
  if (q === 'plaza' || q === 'mine' || q === 'rules') {
    mainTab.value = q
  }
})

watch(mainTab, (t) => {
  if (route.query.tab === t) return
  router.replace({ path: route.path, query: { ...route.query, tab: t } })
})

watch(
  () => auth.isAuthenticated,
  () => {
    void store.refreshMine()
  },
  { immediate: true },
)

watch(mainTab, (t) => {
  if (t === 'mine' && auth.isAuthenticated) void store.refreshMine()
})

watch(
  [mainTab, () => positions.value.length],
  () => {
    if (posTimer) {
      clearInterval(posTimer)
      posTimer = null
    }
    if (mainTab.value === 'mine' && auth.isAuthenticated && positions.value.length) {
      posTimer = setInterval(() => {
        void store.refreshPositionsLive()
      }, 22_000)
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  if (posTimer) clearInterval(posTimer)
})

function marketLabel(m: CopyMarket) {
  return m === 'SPOT' ? '现货' : '合约'
}

function riskStars(level: number) {
  const n = Math.min(5, Math.max(1, level))
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

function openProfile(t: LeadTrader) {
  profileTrader.value = t
  profileOpen.value = true
}

function onProfileFollow() {
  const t = profileTrader.value
  profileOpen.value = false
  if (t) openFollow(t)
}

function onProfileAdjust() {
  const t = profileTrader.value
  profileOpen.value = false
  if (t) openAdjust(t)
}

function openFollow(t: LeadTrader) {
  settingsTrader.value = t
  settingsInitial.value = null
  settingsEdit.value = false
  settingsOpen.value = true
}

function openAdjust(t: LeadTrader) {
  const sub = subscriptions.value.find((s) => s.traderId === t.id)
  settingsTrader.value = t
  settingsInitial.value = sub
    ? {
        marginPerOrderUsdt: sub.marginPerOrderUsdt,
        copyRatio: sub.copyRatio,
        maxDailyLossPct: sub.maxDailyLossPct,
        copySpot: sub.copySpot,
        copyFutures: sub.copyFutures,
      }
    : null
  settingsEdit.value = true
  settingsOpen.value = true
}

async function onSaveSettings(
  draft: Omit<CopyFollowSettings, 'traderId' | 'startedAt' | 'updatedAt' | 'status'>,
) {
  const t = settingsTrader.value
  if (!t) return
  if (settingsEdit.value) {
    const ok = await store.saveSettings(t.id, draft)
    if (ok) settingsOpen.value = false
  } else {
    const ok = await store.startFollow(t.id, draft)
    if (ok) {
      settingsOpen.value = false
      mainTab.value = 'mine'
    }
  }
}

function toggleExpand(id: string) {
  expandedTraderId.value = expandedTraderId.value === id ? null : id
}

function confirmStop(traderId: string, name: string) {
  if (typeof window !== 'undefined' && !window.confirm(`确定停止跟随「${name}」？演示将清空该带单员相关持仓记录。`)) {
    return
  }
  void store.stopFollow(traderId)
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' })
}

function sideLabel(side: string) {
  if (side === 'LONG' || side === 'BUY') return '多'
  if (side === 'SHORT' || side === 'SELL') return '空'
  return side
}

const sortOptions = computed(() => [
  { v: 'roi30d' as const, lab: '30 日收益率' },
  { v: 'drawdown' as const, lab: '最大回撤（升序）' },
  { v: 'followers' as const, lab: '跟随人数' },
  { v: 'aum' as const, lab: '带单规模' },
])

const plazaKpis = computed(() => {
  const list = leaders.value
  const aum = list.reduce((s, x) => s + x.aumUsdt, 0)
  const fol = list.reduce((s, x) => s + x.followers, 0)
  return { traders: list.length, aum, followers: fol }
})
</script>

<template>
  <div class="ctp">
    <header class="ctp__hero">
      <div class="ctp__hero-text">
        <h1 class="ctp__title">跟单交易</h1>
        <p class="ctp__sub">
          一键跟随优质带单员，按单笔金额与倍数复制现货/合约逻辑；支持暂停、调参与单日止损线。以下为演示数据，配置保存在本机。
        </p>
        <ul class="ctp__kpi" aria-label="广场概览">
          <li class="ctp__kpi-item">
            <span class="ctp__kpi-k">入驻带单员</span>
            <span class="ctp__kpi-v ex-num">{{ plazaKpis.traders }}</span>
          </li>
          <li class="ctp__kpi-item">
            <span class="ctp__kpi-k">展示 AUM 合计</span>
            <span class="ctp__kpi-v ex-num">{{ formatCompact(plazaKpis.aum) }} USDT</span>
          </li>
          <li class="ctp__kpi-item">
            <span class="ctp__kpi-k">累计跟随人次</span>
            <span class="ctp__kpi-v ex-num">{{ formatCompact(plazaKpis.followers) }}</span>
          </li>
        </ul>
      </div>
      <div class="ctp__hero-links">
        <RouterLink
          class="ctp__link"
          :to="{ name: RouteNames.SpotTrade, params: { symbol: 'BTC_USDT' } }"
        >
          现货
        </RouterLink>
        <RouterLink
          class="ctp__link"
          :to="{ name: RouteNames.ContractTrade, params: { symbol: 'BTCUSDT' } }"
        >
          合约
        </RouterLink>
        <RouterLink class="ctp__link" :to="{ name: RouteNames.Convert }">闪兑</RouterLink>
      </div>
    </header>

    <p v-if="!auth.isAuthenticated" class="ctp__auth-hint">
      未登录可浏览交易员广场；
      <RouterLink :to="{ name: RouteNames.Login }" class="ctp__a">登录</RouterLink>
      后开启跟单，配置将保存在本机（演示）。
    </p>

    <nav class="ctp__tabs" aria-label="跟单主导航">
      <button
        type="button"
        class="ctp__tab"
        :class="{ 'ctp__tab--on': mainTab === 'plaza' }"
        @click="mainTab = 'plaza'"
      >
        交易员广场
      </button>
      <button
        type="button"
        class="ctp__tab"
        :class="{ 'ctp__tab--on': mainTab === 'mine' }"
        @click="mainTab = 'mine'"
      >
        我的跟单
      </button>
      <button
        type="button"
        class="ctp__tab"
        :class="{ 'ctp__tab--on': mainTab === 'rules' }"
        @click="mainTab = 'rules'"
      >
        规则与风险
      </button>
    </nav>

    <!-- 广场 -->
    <template v-if="mainTab === 'plaza'">
      <div class="ctp__toolbar">
        <input
          v-model="searchQuery"
          type="search"
          class="ctp__search"
          placeholder="搜索交易员或标签…"
          aria-label="搜索交易员"
        />
        <div class="ctp__filters">
          <span class="ctp__flab">市场</span>
          <div class="ctp__chips">
            <button
              type="button"
              class="ctp__chip"
              :class="{ 'ctp__chip--on': marketFilter === 'ALL' }"
              @click="marketFilter = 'ALL'"
            >
              全部
            </button>
            <button
              type="button"
              class="ctp__chip"
              :class="{ 'ctp__chip--on': marketFilter === 'SPOT' }"
              @click="marketFilter = 'SPOT'"
            >
              现货
            </button>
            <button
              type="button"
              class="ctp__chip"
              :class="{ 'ctp__chip--on': marketFilter === 'FUTURES' }"
              @click="marketFilter = 'FUTURES'"
            >
              合约
            </button>
          </div>
        </div>
        <div class="ctp__sort">
          <label class="ctp__flab" for="ctp-sort">排序</label>
          <select id="ctp-sort" v-model="sortKey" class="ctp__select">
            <option v-for="o in sortOptions" :key="o.v" :value="o.v">{{ o.lab }}</option>
          </select>
        </div>
        <div class="ctp__risk-filters">
          <span class="ctp__flab">风险</span>
          <div class="ctp__chips">
            <button
              type="button"
              class="ctp__chip"
              :class="{ 'ctp__chip--on': riskFilter === 'all' }"
              @click="riskFilter = 'all'"
            >
              全部
            </button>
            <button
              type="button"
              class="ctp__chip"
              :class="{ 'ctp__chip--on': riskFilter === 'low' }"
              @click="riskFilter = 'low'"
            >
              偏低
            </button>
            <button
              type="button"
              class="ctp__chip"
              :class="{ 'ctp__chip--on': riskFilter === 'mid' }"
              @click="riskFilter = 'mid'"
            >
              中等
            </button>
            <button
              type="button"
              class="ctp__chip"
              :class="{ 'ctp__chip--on': riskFilter === 'high' }"
              @click="riskFilter = 'high'"
            >
              偏高
            </button>
          </div>
        </div>
        <div class="ctp__view-toggle" role="group" aria-label="展示方式">
          <span class="ctp__flab">视图</span>
          <div class="ctp__seg">
            <button
              type="button"
              class="ctp__seg-btn"
              :class="{ 'ctp__seg-btn--on': plazaView === 'grid' }"
              @click="plazaView = 'grid'"
            >
              卡片
            </button>
            <button
              type="button"
              class="ctp__seg-btn"
              :class="{ 'ctp__seg-btn--on': plazaView === 'table' }"
              @click="plazaView = 'table'"
            >
              列表
            </button>
          </div>
        </div>
      </div>

      <ExPageState
        :loading="loadingLeaders"
        use-skeleton
        skeleton-variant="panel"
        :error="leadersError"
        :empty="!loadingLeaders && !filteredLeaders.length"
        empty-title="暂无符合条件的交易员"
        empty-description="尝试更换市场筛选或清空搜索。"
        loading-text="加载带单员…"
        @retry="store.bootstrapLeaders(true)"
      >
        <div v-if="plazaView === 'grid'" class="ctp__grid">
          <article v-for="t in filteredLeaders" :key="t.id" class="ctp-card">
            <div class="ctp-card__top">
              <div
                class="ctp-card__avatar"
                :style="{ background: `hsl(${t.avatarHue} 55% 38%)` }"
                :aria-hidden="true"
              >
                {{ t.displayName.slice(0, 1) }}
              </div>
              <div class="ctp-card__headtext">
                <h2 class="ctp-card__name">{{ t.displayName }}</h2>
                <p class="ctp-card__risk">风险 <span class="ctp-card__stars">{{ riskStars(t.riskLevel) }}</span></p>
              </div>
            </div>
            <div class="ctp-card__metrics">
              <div class="ctp-card__m">
                <span class="ctp-card__mk">30 日收益</span>
                <span
                  class="ctp-card__mv ex-num"
                  :class="t.roi30dPct >= 0 ? 'ctp-card__mv--up' : 'ctp-card__mv--dn'"
                  >{{ t.roi30dPct >= 0 ? '+' : '' }}{{ formatPrice(t.roi30dPct) }}%</span
                >
              </div>
              <div class="ctp-card__m">
                <span class="ctp-card__mk">90 日收益</span>
                <span
                  class="ctp-card__mv ex-num"
                  :class="t.roi90dPct >= 0 ? 'ctp-card__mv--up' : 'ctp-card__mv--dn'"
                  >{{ t.roi90dPct >= 0 ? '+' : '' }}{{ formatPrice(t.roi90dPct) }}%</span
                >
              </div>
              <div class="ctp-card__m">
                <span class="ctp-card__mk">最大回撤</span>
                <span class="ctp-card__mv ex-num">{{ formatPrice(t.maxDrawdownPct) }}%</span>
              </div>
              <div class="ctp-card__m">
                <span class="ctp-card__mk">胜率</span>
                <span class="ctp-card__mv ex-num">{{ formatPrice(t.winRatePct) }}%</span>
              </div>
              <div class="ctp-card__m">
                <span class="ctp-card__mk">跟随</span>
                <span class="ctp-card__mv ex-num">{{ formatCompact(t.followers) }}</span>
              </div>
              <div class="ctp-card__m">
                <span class="ctp-card__mk">30 日带单</span>
                <span class="ctp-card__mv ex-num">{{ t.trades30d }} 笔</span>
              </div>
            </div>
            <div class="ctp-card__tags">
              <span v-for="tag in t.tags" :key="tag" class="ctp-card__tag">{{ tag }}</span>
              <span v-for="m in t.markets" :key="m" class="ctp-card__tag ctp-card__tag--m">{{ marketLabel(m) }}</span>
            </div>
            <div class="ctp-card__mid-actions">
              <button type="button" class="ctp-card__bio-btn" @click="toggleExpand(t.id)">
                {{ expandedTraderId === t.id ? '收起简介' : '简介与策略' }}
              </button>
              <button type="button" class="ctp-card__bio-btn ctp-card__bio-btn--sec" @click="openProfile(t)">
                详情
              </button>
            </div>
            <p v-show="expandedTraderId === t.id" class="ctp-card__bio">{{ t.bio }}</p>
            <div class="ctp-card__foot">
              <span class="ctp-card__aum">AUM ≈ {{ formatCompact(t.aumUsdt) }} USDT</span>
              <div class="ctp-card__actions">
                <template v-if="store.isFollowing(t.id)">
                  <button type="button" class="ctp-card__btn ctp-card__btn--ghost" @click="openAdjust(t)">
                    调整
                  </button>
                  <span class="ctp-card__pill">跟单中</span>
                </template>
                <button v-else type="button" class="ctp-card__btn ctp-card__btn--primary" @click="openFollow(t)">
                  跟单
                </button>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="ctp-table-wrap">
          <table class="ctp-table" aria-label="交易员列表">
            <thead>
              <tr>
                <th>交易员</th>
                <th>30 日</th>
                <th>90 日</th>
                <th>回撤</th>
                <th>胜率</th>
                <th>跟随</th>
                <th>AUM</th>
                <th>市场</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in filteredLeaders" :key="t.id">
                <td>
                  <div class="ctp-table__trader">
                    <span
                      class="ctp-table__av"
                      :style="{ background: `hsl(${t.avatarHue} 55% 38%)` }"
                      >{{ t.displayName.slice(0, 1) }}</span
                    >
                    <div>
                      <span class="ctp-table__name">{{ t.displayName }}</span>
                      <span class="ctp-table__sub">{{ riskStars(t.riskLevel) }}</span>
                    </div>
                  </div>
                </td>
                <td
                  class="ex-num"
                  :class="t.roi30dPct >= 0 ? 'ctp-pos__pnl--up' : 'ctp-pos__pnl--dn'"
                >
                  {{ t.roi30dPct >= 0 ? '+' : '' }}{{ formatPrice(t.roi30dPct) }}%
                </td>
                <td
                  class="ex-num"
                  :class="t.roi90dPct >= 0 ? 'ctp-pos__pnl--up' : 'ctp-pos__pnl--dn'"
                >
                  {{ t.roi90dPct >= 0 ? '+' : '' }}{{ formatPrice(t.roi90dPct) }}%
                </td>
                <td class="ex-num">{{ formatPrice(t.maxDrawdownPct) }}%</td>
                <td class="ex-num">{{ formatPrice(t.winRatePct) }}%</td>
                <td class="ex-num">{{ formatCompact(t.followers) }}</td>
                <td class="ex-num">{{ formatCompact(t.aumUsdt) }}</td>
                <td>
                  <span v-for="m in t.markets" :key="m" class="ctp-table__m">{{ marketLabel(m) }}</span>
                </td>
                <td class="ctp-table__act">
                  <button type="button" class="ctp-table__link" @click="openProfile(t)">详情</button>
                  <template v-if="store.isFollowing(t.id)">
                    <button type="button" class="ctp-table__btn" @click="openAdjust(t)">调整</button>
                  </template>
                  <button v-else type="button" class="ctp-table__btn ctp-table__btn--pri" @click="openFollow(t)">
                    跟单
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ExPageState>
    </template>

    <!-- 我的 -->
    <template v-else-if="mainTab === 'mine'">
      <ExPageState
        :unauthorized="!auth.isAuthenticated"
        :loading="auth.isAuthenticated && loadingMine && !subscriptions.length && !positions.length"
        use-skeleton
        skeleton-variant="list"
        :error="mineError"
        @retry="store.refreshMine()"
      >
        <div v-if="auth.isAuthenticated" class="ctp-mine">
          <div class="ctp-mine__stats">
            <div class="ctp-mine__stat">
              <span class="ctp-mine__sk">活跃跟单</span>
              <span class="ctp-mine__sv ex-num">{{ activeSubscriptions.length }}</span>
            </div>
            <div class="ctp-mine__stat">
              <span class="ctp-mine__sk">订阅总数</span>
              <span class="ctp-mine__sv ex-num">{{ subscriptions.length }}</span>
            </div>
            <div class="ctp-mine__stat">
              <span class="ctp-mine__sk">未实现盈亏（演示）</span>
              <span
                class="ctp-mine__sv ex-num"
                :class="totalUnrealizedUsdt >= 0 ? 'ctp-mine__sv--up' : 'ctp-mine__sv--dn'"
                >{{ totalUnrealizedUsdt >= 0 ? '+' : '' }}{{ formatPrice(totalUnrealizedUsdt) }} USDT</span
              >
            </div>
          </div>

          <section class="ctp-sec" aria-label="跟单列表">
            <h3 class="ctp-sec__title">订阅管理</h3>
            <p v-if="!subscriptions.length" class="ctp-sec__empty">尚未跟单任何交易员，请在「交易员广场」开启。</p>
            <ul v-else class="ctp-subs">
              <li v-for="s in subscriptions" :key="s.traderId" class="ctp-sub">
                <div class="ctp-sub__main">
                  <div
                    class="ctp-sub__avatar"
                    :style="{ background: `hsl(${s.trader.avatarHue} 55% 38%)` }"
                  >
                    {{ s.trader.displayName.slice(0, 1) }}
                  </div>
                  <div>
                    <span class="ctp-sub__name">{{ s.trader.displayName }}</span>
                    <span class="ctp-sub__meta"
                      >单笔 {{ formatPrice(s.marginPerOrderUsdt) }} USDT · {{ s.copyRatio }}x · 止损
                      {{ formatPrice(s.maxDailyLossPct) }}%</span
                    >
                    <div class="ctp-sub__flags">
                      <span v-if="s.copySpot" class="ctp-sub__f">现货</span>
                      <span v-if="s.copyFutures" class="ctp-sub__f">合约</span>
                      <span class="ctp-sub__f" :data-paused="s.status === 'paused'">{{
                        s.status === 'paused' ? '已暂停' : '跟单中'
                      }}</span>
                    </div>
                  </div>
                </div>
                <div class="ctp-sub__actions">
                  <button
                    type="button"
                    class="ctp-sub__btn"
                    @click="store.pauseFollow(s.traderId, s.status === 'active')"
                  >
                    {{ s.status === 'active' ? '暂停' : '恢复' }}
                  </button>
                  <button
                    type="button"
                    class="ctp-sub__btn"
                    @click="
                      openAdjust(
                        filteredLeaders.find((x) => x.id === s.traderId) ??
                          ({
                            id: s.traderId,
                            displayName: s.trader.displayName,
                            avatarHue: s.trader.avatarHue,
                            roi30dPct: s.trader.roi30dPct,
                            roi90dPct: 0,
                            winRatePct: 0,
                            maxDrawdownPct: 0,
                            followers: s.trader.followers,
                            aumUsdt: 0,
                            tags: [],
                            markets: [
                              ...(s.copySpot ? (['SPOT'] as CopyMarket[]) : []),
                              ...(s.copyFutures ? (['FUTURES'] as CopyMarket[]) : []),
                            ],
                            riskLevel: 3,
                            trades30d: 0,
                            bio: '',
                          } as LeadTrader),
                      )
                    "
                  >
                    调整
                  </button>
                  <button type="button" class="ctp-sub__btn ctp-sub__btn--danger" @click="confirmStop(s.traderId, s.trader.displayName)">
                    停止
                  </button>
                </div>
              </li>
            </ul>
          </section>

          <section class="ctp-sec" aria-label="当前跟单持仓">
            <h3 class="ctp-sec__title">当前持仓（演示）</h3>
            <p v-if="!positions.length" class="ctp-sec__empty">暂无持仓；跟单成功后将生成模拟仓位并定时刷新标记价格。</p>
            <ul v-else class="ctp-pos-cards">
              <li v-for="p in positions" :key="p.id" class="ctp-pos-card">
                <div class="ctp-pos-card__row">
                  <span class="ctp-pos-card__pair ex-num">{{ p.symbol }}</span>
                  <span class="ctp-pos-card__side" :data-long="p.side === 'LONG' || p.side === 'BUY'">{{
                    sideLabel(p.side)
                  }}</span>
                </div>
                <div class="ctp-pos-card__row ctp-pos-card__row--meta">
                  <span>{{ p.traderName }}</span>
                  <span>{{ marketLabel(p.market) }}</span>
                  <span v-if="p.leverage">{{ p.leverage }}x</span>
                </div>
                <div class="ctp-pos-card__grid">
                  <div>
                    <span class="ctp-pos-card__k">开仓价</span>
                    <span class="ctp-pos-card__v ex-num">{{ formatPrice(p.entryPrice) }}</span>
                  </div>
                  <div>
                    <span class="ctp-pos-card__k">标记价</span>
                    <span class="ctp-pos-card__v ex-num">{{ formatPrice(p.markPrice) }}</span>
                  </div>
                  <div>
                    <span class="ctp-pos-card__k">数量</span>
                    <span class="ctp-pos-card__v ex-num">{{ formatPrice(p.qty) }}</span>
                  </div>
                  <div>
                    <span class="ctp-pos-card__k">未实现盈亏</span>
                    <span
                      class="ctp-pos-card__v ex-num"
                      :class="p.uPnlUsdt >= 0 ? 'ctp-pos__pnl--up' : 'ctp-pos__pnl--dn'"
                    >
                      {{ p.uPnlUsdt >= 0 ? '+' : '' }}{{ formatPrice(p.uPnlUsdt) }} USDT
                    </span>
                  </div>
                </div>
              </li>
            </ul>
            <div v-if="positions.length" class="ctp-pos-wrap ctp-pos-wrap--desktop">
              <table class="ctp-pos">
                <thead>
                  <tr>
                    <th>带单员</th>
                    <th>市场</th>
                    <th>标的</th>
                    <th>方向</th>
                    <th>杠杆</th>
                    <th>开仓价</th>
                    <th>标记价</th>
                    <th>数量</th>
                    <th>未实现盈亏</th>
                    <th>开仓时间</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in positions" :key="'d-' + p.id">
                    <td>{{ p.traderName }}</td>
                    <td>{{ marketLabel(p.market) }}</td>
                    <td class="ex-num">{{ p.symbol }}</td>
                    <td>{{ sideLabel(p.side) }}</td>
                    <td class="ex-num">{{ p.leverage ? `${p.leverage}x` : '—' }}</td>
                    <td class="ex-num">{{ formatPrice(p.entryPrice) }}</td>
                    <td class="ex-num">{{ formatPrice(p.markPrice) }}</td>
                    <td class="ex-num">{{ formatPrice(p.qty) }}</td>
                    <td
                      class="ex-num"
                      :class="p.uPnlUsdt >= 0 ? 'ctp-pos__pnl--up' : 'ctp-pos__pnl--dn'"
                    >
                      {{ p.uPnlUsdt >= 0 ? '+' : '' }}{{ formatPrice(p.uPnlUsdt) }}
                    </td>
                    <td class="ctp-pos__time">{{ fmtTime(p.openedAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="ctp-sec" aria-label="历史">
            <h3 class="ctp-sec__title">最近平仓（演示）</h3>
            <p v-if="!history.length" class="ctp-sec__empty">暂无平仓记录；新跟单后会生成演示历史。</p>
            <div v-else class="ctp-pos-wrap">
              <table class="ctp-pos ctp-pos--hist">
                <thead>
                  <tr>
                    <th>带单员</th>
                    <th>市场</th>
                    <th>标的</th>
                    <th>盈亏 (USDT)</th>
                    <th>平仓时间</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="h in history" :key="h.id">
                    <td>{{ h.traderName }}</td>
                    <td>{{ marketLabel(h.market) }}</td>
                    <td class="ex-num">{{ h.symbol }}</td>
                    <td
                      class="ex-num"
                      :class="h.pnlUsdt >= 0 ? 'ctp-pos__pnl--up' : 'ctp-pos__pnl--dn'"
                    >
                      {{ h.pnlUsdt >= 0 ? '+' : '' }}{{ formatPrice(h.pnlUsdt) }}
                    </td>
                    <td class="ctp-pos__time">{{ fmtTime(h.closedAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </ExPageState>
    </template>

    <!-- 规则 -->
    <section v-else class="ctp-rules" aria-label="规则与风险">
      <h2 class="ctp-rules__title">产品规则与风险提示（演示）</h2>
      <ol class="ctp-rules__list">
        <li>
          <strong>复制逻辑：</strong>按您设定的单笔跟单金额与倍数，在带单员开仓时生成同向、同标的的跟单订单（演示为本地模拟仓位，不接真实撮合）。
        </li>
        <li>
          <strong>市场范围：</strong>可分别勾选现货 / 合约；若带单员不支持某市场，对应选项将不可用。
        </li>
        <li>
          <strong>单日止损：</strong>当日跟单浮动亏损达到设定比例时，系统将暂停该订阅（演示为状态位，无真实风控引擎）。
        </li>
        <li>
          <strong>暂停与终止：</strong>可随时暂停、恢复、调整参数或停止跟单；停止后将清除与该带单员关联的演示持仓（历史平仓可保留至本地存储上限）。
        </li>
        <li>
          <strong>分润与结算：</strong>生产环境需配置带单分润、资金费率与结算周期；本演示不包含分润扣款。
        </li>
        <li>
          <strong>免责声明：</strong>历史收益率、胜率、回撤等仅供展示，不构成收益承诺；请根据自身风险承受能力谨慎参与。
        </li>
      </ol>
      <p class="ctp-rules__link">
        体验设计参考
        <a
          class="ctp__a"
          href="https://www.binance.com/zh-CN/copy-trading"
          target="_blank"
          rel="noopener noreferrer"
          >币安跟单</a
        >
        ；生产环境需接入带单账户、分润结算、风控与合规审查。
      </p>
    </section>

    <CopyFollowSettingsModal
      v-model="settingsOpen"
      :trader="settingsTrader"
      :initial="settingsInitial"
      :edit-mode="settingsEdit"
      @save="onSaveSettings"
    />

    <CopyTraderProfileModal
      v-model="profileOpen"
      :trader="profileTrader"
      :following="profileTrader ? store.isFollowing(profileTrader.id) : false"
      @follow="onProfileFollow"
      @adjust="onProfileAdjust"
    />
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.ctp {
  max-width: min(1120px, var(--ex-container-max));
  margin: 0 auto;
  padding: 0 $space-4 $space-8;
  box-sizing: border-box;
}

.ctp__hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-3;
  margin-bottom: $space-4;
}

.ctp__hero-text {
  flex: 1;
  min-width: min(100%, 320px);
}

.ctp__kpi {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  margin: $space-4 0 0;
  padding: 0;
  list-style: none;
}

.ctp__kpi-item {
  min-width: 140px;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid var(--ex-border-subtle);
  background: var(--ex-panel-sunken);
}

.ctp__kpi-k {
  display: block;
  font-size: 10px;
  color: $color-text-tertiary;
  margin-bottom: 4px;
}

.ctp__kpi-v {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ctp__title {
  margin: 0 0 $space-1;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ctp__sub {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  max-width: 680px;
  line-height: 1.55;
}

.ctp__hero-links {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.ctp__link {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-brand;
  text-decoration: none;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.35);
  background: rgba(240, 185, 11, 0.08);
}

.ctp__link:hover {
  background: rgba(240, 185, 11, 0.14);
}

.ctp__auth-hint {
  font-size: $font-size-xs;
  color: $color-text-secondary;
  margin: 0 0 $space-4;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  background: rgba(48, 132, 252, 0.08);
  border: 1px solid rgba(48, 132, 252, 0.2);
}

.ctp__a {
  color: $color-brand;
  text-decoration: none;
  font-weight: $font-weight-semibold;
}

.ctp__a:hover {
  text-decoration: underline;
}

.ctp__tabs {
  display: flex;
  gap: 8px;
  margin-bottom: $space-4;
  padding: 6px;
  border-radius: $radius-md;
  background: var(--ex-surface-inset);
  border: 1px solid $color-border;
  width: fit-content;
  max-width: 100%;
  flex-wrap: wrap;
}

.ctp__tab {
  border: none;
  background: transparent;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  padding: 10px 18px;
  border-radius: $radius-sm;
  cursor: pointer;
}

.ctp__tab--on {
  background: rgba(240, 185, 11, 0.18);
  color: $color-brand;
}

.ctp__toolbar {
  margin-bottom: $space-4;
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
  display: flex;
  flex-direction: column;
  gap: $space-3;

  @include mq.media-up(md) {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-end;
  }
}

.ctp__search {
  flex: 1;
  min-width: 200px;
  padding: 10px 14px;
  border-radius: $radius-md;
  border: 1px solid var(--ex-border);
  background: var(--ex-surface-inset-strong);
  color: $color-text-primary;
  font-size: $font-size-sm;

  &:focus {
    outline: none;
    border-color: rgba(240, 185, 11, 0.35);
  }
}

.ctp__filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ctp__flab {
  font-size: 11px;
  color: $color-text-tertiary;
  font-weight: $font-weight-semibold;
}

.ctp__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ctp__chip {
  border: 1px solid $color-border;
  background: var(--ex-fill-ghost);
  color: $color-text-secondary;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  padding: 6px 14px;
  border-radius: $radius-sm;
  cursor: pointer;
}

.ctp__chip--on {
  border-color: rgba(240, 185, 11, 0.45);
  background: rgba(240, 185, 11, 0.12);
  color: $color-brand;
}

.ctp__sort {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ctp__select {
  padding: 10px 12px;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-surface-inset-strong);
  color: $color-text-primary;
  font-size: $font-size-sm;
  min-width: 180px;
}

.ctp__risk-filters,
.ctp__view-toggle {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ctp__seg {
  display: inline-flex;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  overflow: hidden;
}

.ctp__seg-btn {
  padding: 8px 16px;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  border: none;
  background: var(--ex-fill-ghost);
  color: $color-text-secondary;
  cursor: pointer;
}

.ctp__seg-btn--on {
  background: rgba(240, 185, 11, 0.15);
  color: $color-brand;
}

.ctp__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-4;

  @include mq.media-up(sm) {
    grid-template-columns: repeat(2, 1fr);
  }

  @include mq.media-up(lg) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.ctp-table-wrap {
  border-radius: $radius-md;
  border: 1px solid $color-border;
  overflow: auto;
  background: var(--ex-card-surface);
}

.ctp-table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  font-size: $font-size-sm;

  th,
  td {
    padding: $space-3;
    text-align: left;
    border-bottom: 1px solid $color-border;
    vertical-align: middle;
  }

  th {
    font-size: 11px;
    color: $color-text-tertiary;
    background: var(--ex-panel-sunken);
    white-space: nowrap;
  }
}

.ctp-table__trader {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ctp-table__av {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: $font-weight-bold;
  color: #fff;
  font-size: 14px;
  flex-shrink: 0;
}

.ctp-table__name {
  display: block;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ctp-table__sub {
  font-size: 10px;
  color: $color-brand;
  letter-spacing: 1px;
}

.ctp-table__m {
  font-size: 10px;
  padding: 2px 6px;
  margin-right: 4px;
  border-radius: 4px;
  background: rgba(240, 185, 11, 0.1);
  color: $color-brand;
}

.ctp-table__act {
  white-space: nowrap;
}

.ctp-table__link {
  background: none;
  border: none;
  color: $color-brand;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  cursor: pointer;
  margin-right: 8px;
  padding: 0;
}

.ctp-table__btn {
  padding: 6px 12px;
  font-size: 11px;
  font-weight: $font-weight-bold;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-fill-hover-subtle);
  color: $color-text-primary;
  cursor: pointer;
  margin-right: 6px;
}

.ctp-table__btn--pri {
  background: $color-brand;
  color: var(--ex-on-brand);
  border-color: transparent;
}

.ctp-card {
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
  padding: $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.ctp-card__top {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.ctp-card__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: #fff;
  flex-shrink: 0;
}

.ctp-card__name {
  margin: 0;
  font-size: $font-size-md;
  color: $color-text-primary;
}

.ctp-card__risk {
  margin: 4px 0 0;
  font-size: 11px;
  color: $color-text-tertiary;
}

.ctp-card__stars {
  color: $color-brand;
  letter-spacing: 1px;
}

.ctp-card__metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-2;

  @media (max-width: 400px) {
    grid-template-columns: 1fr 1fr;
  }
}

.ctp-card__m {
  padding: $space-2;
  border-radius: $radius-sm;
  background: var(--ex-panel-sunken);
  border: 1px solid var(--ex-border-subtle);
}

.ctp-card__mk {
  display: block;
  font-size: 10px;
  color: $color-text-tertiary;
  margin-bottom: 4px;
}

.ctp-card__mv {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;

  &--up {
    color: $color-rise;
  }

  &--dn {
    color: $color-fall;
  }
}

.ctp-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ctp-card__tag {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(48, 132, 252, 0.12);
  color: #7ab8ff;

  &--m {
    background: rgba(240, 185, 11, 0.12);
    color: $color-brand;
  }
}

.ctp-card__mid-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  align-items: center;
}

.ctp-card__bio-btn {
  align-self: flex-start;
  border: none;
  background: transparent;
  color: $color-brand;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  cursor: pointer;
  padding: 0;

  &--sec {
    color: $color-text-secondary;
  }
}

.ctp-card__bio {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.55;
}

.ctp-card__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  margin-top: auto;
  padding-top: $space-2;
  border-top: 1px solid $color-border;
}

.ctp-card__aum {
  font-size: 11px;
  color: $color-text-tertiary;
}

.ctp-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ctp-card__pill {
  font-size: 11px;
  font-weight: $font-weight-bold;
  padding: 6px 12px;
  border-radius: $radius-sm;
  background: rgba(14, 203, 129, 0.12);
  color: $color-rise;
}

.ctp-card__btn {
  padding: 8px 18px;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  cursor: pointer;
  border: none;
}

.ctp-card__btn--primary {
  background: $color-brand;
  color: var(--ex-on-brand);
}

.ctp-card__btn--ghost {
  background: transparent;
  border: 1px solid $color-border;
  color: $color-text-primary;
}

.ctp-mine__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: $space-3;
  margin-bottom: $space-5;
}

.ctp-mine__stat {
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
}

.ctp-mine__sk {
  display: block;
  font-size: 11px;
  color: $color-text-tertiary;
  margin-bottom: 8px;
}

.ctp-mine__sv {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;

  &--up {
    color: $color-rise;
  }

  &--dn {
    color: $color-fall;
  }
}

.ctp-sec {
  margin-bottom: $space-5;
}

.ctp-sec__title {
  margin: 0 0 $space-3;
  font-size: $font-size-md;
  color: $color-text-primary;
}

.ctp-sec__empty {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}

.ctp-subs {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.ctp-sub {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-3;
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.ctp-sub__main {
  display: flex;
  gap: $space-3;
  min-width: 0;
}

.ctp-sub__avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: $font-weight-bold;
  color: #fff;
}

.ctp-sub__name {
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  display: block;
}

.ctp-sub__meta {
  display: block;
  font-size: 11px;
  color: $color-text-tertiary;
  margin-top: 4px;
}

.ctp-sub__flags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.ctp-sub__f {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--ex-fill-hover-subtle);
  color: $color-text-secondary;

  &[data-paused='true'] {
    background: rgba(246, 70, 93, 0.12);
    color: $color-fall;
  }
}

.ctp-sub__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ctp-sub__btn {
  padding: 8px 14px;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-fill-hover-subtle);
  color: $color-text-primary;
  cursor: pointer;
}

.ctp-sub__btn--danger {
  border-color: rgba(246, 70, 93, 0.35);
  color: $color-fall;
}

.ctp-pos-cards {
  list-style: none;
  margin: 0 0 $space-3;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;

  @include mq.media-up(md) {
    display: none;
  }
}

.ctp-pos-card {
  padding: $space-3;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
}

.ctp-pos-card__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  &--meta {
    font-size: 11px;
    color: $color-text-tertiary;
    gap: $space-2;
    flex-wrap: wrap;
  }
}

.ctp-pos-card__pair {
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ctp-pos-card__side[data-long='true'] {
  color: $color-rise;
  font-weight: $font-weight-bold;
  font-size: $font-size-xs;
}

.ctp-pos-card__side[data-long='false'] {
  color: $color-fall;
  font-weight: $font-weight-bold;
  font-size: $font-size-xs;
}

.ctp-pos-card__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  font-size: 11px;
  padding-top: 8px;
  border-top: 1px solid $color-border;
}

.ctp-pos-card__k {
  display: block;
  color: $color-text-tertiary;
  margin-bottom: 2px;
}

.ctp-pos-card__v {
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.ctp-pos-wrap {
  border-radius: $radius-md;
  border: 1px solid $color-border;
  overflow: auto;
  background: var(--ex-card-surface);
}

.ctp-pos-wrap--desktop {
  display: none;

  @include mq.media-up(md) {
    display: block;
  }
}

.ctp-pos {
  width: 100%;
  border-collapse: collapse;
  font-size: $font-size-sm;

  th,
  td {
    padding: $space-3 $space-3;
    text-align: left;
    border-bottom: 1px solid $color-border;
    white-space: nowrap;
  }

  th {
    font-size: 11px;
    color: $color-text-tertiary;
    background: var(--ex-panel-sunken);
  }
}

.ctp-pos__pnl--up {
  color: $color-rise;
}

.ctp-pos__pnl--dn {
  color: $color-fall;
}

.ctp-pos__time {
  font-size: 11px;
  color: $color-text-tertiary;
  white-space: nowrap;
}

.ctp-pos--hist {
  min-width: 560px;
}

.ctp-rules {
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.ctp-rules__title {
  margin: 0 0 $space-3;
  font-size: $font-size-md;
  color: $color-text-primary;
}

.ctp-rules__list {
  margin: 0 0 $space-4;
  padding-left: 1.25rem;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  line-height: 1.65;
}

.ctp-rules__link {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.5;
}
</style>
