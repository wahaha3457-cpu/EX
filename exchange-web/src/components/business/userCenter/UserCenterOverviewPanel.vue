<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  Plus,
  Minus,
  Sort,
  Wallet,
  Lock,
  Message,
  Iphone,
  Key,
  InfoFilled,
  Document,
  Monitor,
  CircleCheck,
  Warning,
} from '@element-plus/icons-vue'
import { useUserCenterStore } from '@/stores/userCenter'
import { useAssetsCenterStore } from '@/stores/assetsCenter'
import { useSecurityCenterUiStore } from '@/stores/securityCenterUi'
import { useSecurityItemAction } from '@/composables/userCenter/useSecurityItemAction'
import { RouteNames } from '@/constants/routeNames'
import type { UserCenterSecurityItem, UserKycStatus } from '@/types/userCenter'
import { formatPrice } from '@/utils/format/number'

const store = useUserCenterStore()
const assetsStore = useAssetsCenterStore()
const secUi = useSecurityCenterUiStore()
const { onSecurityItemAction } = useSecurityItemAction()
const { overview, account, securityItems, loginRecords } = storeToRefs(store)
const { phoneBound, phoneMasked, emailMaskedOverride } = storeToRefs(secUi)
const { overview: assetsOverview, payload: assetsPayload } = storeToRefs(assetsStore)
const router = useRouter()

onMounted(() => {
  if (!assetsPayload.value) void assetsStore.bootstrap()
})

const ringCirc = 2 * Math.PI * 44

const securityScore = computed(() => {
  const s = account.value?.securityScore
  if (s == null || !Number.isFinite(s)) return 0
  return Math.min(100, Math.max(0, Math.round(s)))
})

const ringOffset = computed(() => ringCirc * (1 - securityScore.value / 100))

const securityLevelLabel = computed(() => {
  const lv = account.value?.securityLevel
  if (lv === 'HIGH') return '高'
  if (lv === 'MEDIUM') return '中'
  if (lv === 'LOW') return '低'
  return '—'
})

const securityLevelClass = computed(() => {
  const lv = account.value?.securityLevel
  if (lv === 'HIGH') return 'uc-ov__lv--high'
  if (lv === 'MEDIUM') return 'uc-ov__lv--mid'
  if (lv === 'LOW') return 'uc-ov__lv--low'
  return 'uc-ov__lv--na'
})

const totalUsdtDisplay = computed(() => {
  const t = assetsOverview.value?.totalUsdt
  if (t == null) return '—'
  return formatPrice(t)
})

const distributionRows = computed(() => assetsOverview.value?.distribution ?? [])

const lastLogin = computed(() => {
  const a = account.value
  if (!a?.lastLoginAt) return null
  try {
    return {
      at: new Date(a.lastLoginAt).toLocaleString('zh-CN', { hour12: false }),
      ip: a.lastLoginIp || '—',
    }
  } catch {
    return { at: a.lastLoginAt, ip: a.lastLoginIp || '—' }
  }
})

const prevLogin = computed(() => {
  const rows = loginRecords.value
  if (rows.length < 2) return null
  const r = rows[1]
  try {
    return {
      at: new Date(r.time).toLocaleString('zh-CN', { hour12: false }),
      device: r.device,
    }
  } catch {
    return { at: r.time, device: r.device }
  }
})

/** 与安全中心同一套 merge（手机/邮箱/GA/白名单等演示态与 store 联动） */
const overviewSecurityItems = computed(() => {
  const order = ['ga', 'phone', 'fund_password', 'email', 'password', 'withdraw_whitelist']
  const merged = secUi.mergeSecurityItems(securityItems.value, overview.value ?? null)
  const map = new Map(merged.map((x) => [x.id, x]))
  const out: UserCenterSecurityItem[] = []
  for (const id of order) {
    const x = map.get(id)
    if (x) out.push(x)
  }
  for (const x of merged) {
    if (!order.includes(x.id) && out.length < 6 && !out.some((o) => o.id === x.id)) out.push(x)
  }
  return out.slice(0, 6)
})

function iconForSecurity(it: UserCenterSecurityItem) {
  const m: Record<string, typeof Lock> = {
    password: Lock,
    email: Message,
    phone: Iphone,
    ga: Key,
    fund_password: Wallet,
    withdraw_whitelist: Document,
    devices: Monitor,
  }
  return m[it.id] ?? Lock
}

function statusDotClass(it: UserCenterSecurityItem) {
  if (it.status === 'ON') return 'uc-ov__sd--on'
  if (it.status === 'PARTIAL') return 'uc-ov__sd--partial'
  return 'uc-ov__sd--off'
}

function kycLabel(s: UserKycStatus) {
  const m: Record<UserKycStatus, string> = {
    NONE: '未认证',
    PENDING: '审核中',
    VERIFIED: '已认证',
    REJECTED: '未通过',
  }
  return m[s] ?? s
}

function kycClass(s: UserKycStatus) {
  if (s === 'VERIFIED') return 'uc-ov__pill--ok'
  if (s === 'PENDING') return 'uc-ov__pill--pend'
  if (s === 'REJECTED') return 'uc-ov__pill--bad'
  return 'uc-ov__pill--muted'
}

/** 联系方式与 `mergeSecurityItems` / 安全矩阵同一数据源（含演示更换邮箱、绑定手机） */
const contactEmailMasked = computed(() => emailMaskedOverride.value ?? overview.value?.emailMasked ?? null)
const contactEmailBound = computed(() => !!contactEmailMasked.value)

const contactPhoneBound = computed(
  () => phoneBound.value || !!(overview.value?.phoneBound && overview.value?.phoneMasked),
)
const contactPhoneMasked = computed(() => {
  if (phoneBound.value) return phoneMasked.value
  return overview.value?.phoneMasked ?? null
})

function goSecurity() {
  void router.push({ name: RouteNames.AccountSecurity })
}

function goAssets() {
  void router.push({ name: RouteNames.Assets })
}

function goAssetsAction(action: 'deposit' | 'withdraw' | 'transfer') {
  void router.push({ name: RouteNames.Assets, query: { action } })
}

function goKyc() {
  void router.push({ name: RouteNames.Verification })
}

function goPreferences() {
  void router.push({ name: RouteNames.Preferences })
}

function goLoginHistory() {
  void router.push({ name: RouteNames.AccountSessions })
}
</script>

<template>
  <div class="uc-ov">
    <header class="uc-ov__head">
      <div>
        <h2 class="uc-ov__title">账户总览</h2>
        <p class="uc-ov__lead">资产与安全一站式总览，快捷充提与账户保护入口。</p>
      </div>
      <RouterLink class="uc-ov__head-link" :to="{ name: RouteNames.OrdersLedger }">资金记录</RouterLink>
    </header>

    <!-- 对标头部所：安全分 + 资产快照 + 快捷操作 -->
    <div class="uc-ov__bento">
      <div class="uc-ov__tile uc-ov__tile--security">
        <p class="uc-ov__tile-label">安全评分</p>
        <div class="uc-ov__dial-wrap">
          <svg class="uc-ov__dial" viewBox="0 0 100 100" aria-hidden="true">
            <circle class="uc-ov__dial-track" cx="50" cy="50" r="44" />
            <circle
              class="uc-ov__dial-prog"
              cx="50"
              cy="50"
              r="44"
              :stroke-dasharray="ringCirc"
              :stroke-dashoffset="ringOffset"
            />
          </svg>
          <div class="uc-ov__dial-core">
            <span class="uc-ov__score ex-num">{{ securityScore }}</span>
            <span class="uc-ov__score-unit">分</span>
          </div>
        </div>
        <div class="uc-ov__dial-meta">
          <span class="uc-ov__lv" :class="securityLevelClass">安全等级 · {{ securityLevelLabel }}</span>
          <p class="uc-ov__dial-hint">完成验证与 2FA 可提升评分与提现额度（演示）。</p>
          <button type="button" class="uc-ov__tile-btn" @click="goSecurity">去安全中心</button>
        </div>
      </div>

      <div class="uc-ov__tile uc-ov__tile--assets">
        <div class="uc-ov__tile-head">
          <Wallet class="uc-ov__tile-ic" aria-hidden="true" />
          <span class="uc-ov__tile-label">总资产估值</span>
        </div>
        <p class="uc-ov__asset-total ex-num">
          {{ totalUsdtDisplay }}
          <span class="uc-ov__asset-unit">USDT</span>
        </p>
        <div v-if="distributionRows.length" class="uc-ov__dist" aria-label="账户分布">
          <div v-for="d in distributionRows" :key="d.account" class="uc-ov__dist-row">
            <span class="uc-ov__dist-lab">{{ d.label }}</span>
            <span class="uc-ov__dist-bar-wrap">
              <span
                class="uc-ov__dist-bar"
                :style="{ width: `${Math.round((d.ratio || 0) * 100)}%` }"
              />
            </span>
            <span class="uc-ov__dist-val ex-num">{{ formatPrice(d.valueUsdt) }}</span>
          </div>
        </div>
        <p v-else class="uc-ov__asset-fallback">进入资产中心加载分布与流水</p>
        <button type="button" class="uc-ov__tile-btn uc-ov__tile-btn--ghost" @click="goAssets">查看资产详情</button>
      </div>

      <div class="uc-ov__tile uc-ov__tile--quick">
        <p class="uc-ov__tile-label">快捷操作</p>
        <div class="uc-ov__quick-grid">
          <button type="button" class="uc-ov__quick-item" @click="goAssetsAction('deposit')">
            <span class="uc-ov__quick-ic"><Plus /></span>
            <span class="uc-ov__quick-txt">充值</span>
          </button>
          <button type="button" class="uc-ov__quick-item" @click="goAssetsAction('withdraw')">
            <span class="uc-ov__quick-ic"><Minus /></span>
            <span class="uc-ov__quick-txt">提现</span>
          </button>
          <button type="button" class="uc-ov__quick-item" @click="goAssetsAction('transfer')">
            <span class="uc-ov__quick-ic"><Sort /></span>
            <span class="uc-ov__quick-txt">划转</span>
          </button>
        </div>
        <div class="uc-ov__quick-links">
          <RouterLink :to="{ name: RouteNames.Convert }" class="uc-ov__ql">闪兑</RouterLink>
          <RouterLink :to="{ name: RouteNames.C2C }" class="uc-ov__ql">C2C</RouterLink>
          <button type="button" class="uc-ov__ql uc-ov__ql--btn" @click="goLoginHistory">登录记录</button>
        </div>
      </div>
    </div>

    <!-- 联系方式 + KYC -->
    <div class="uc-ov__grid">
      <div class="uc-ov__card uc-ov__card--contact">
        <div class="uc-ov__card-head">
          <Message class="uc-ov__card-ic" aria-hidden="true" />
          <h3 class="uc-ov__h">联系方式</h3>
        </div>
        <ul class="uc-ov__list">
          <li class="uc-ov__row">
            <span class="uc-ov__k">邮箱</span>
            <span v-if="contactEmailBound" class="uc-ov__pill uc-ov__pill--ok">
              <CircleCheck class="uc-ov__pill-ic" />已绑定 · {{ contactEmailMasked }}
            </span>
            <span v-else class="uc-ov__pill uc-ov__pill--bad">
              <Warning class="uc-ov__pill-ic" />未绑定
            </span>
          </li>
          <li class="uc-ov__row">
            <span class="uc-ov__k">手机</span>
            <span v-if="contactPhoneBound" class="uc-ov__pill uc-ov__pill--ok">
              <CircleCheck class="uc-ov__pill-ic" />已绑定 · {{ contactPhoneMasked }}
            </span>
            <span v-else class="uc-ov__pill uc-ov__pill--muted">未绑定 · 预留</span>
          </li>
        </ul>
      </div>

      <div class="uc-ov__card uc-ov__card--kyc">
        <div class="uc-ov__card-head">
          <Document class="uc-ov__card-ic" aria-hidden="true" />
          <h3 class="uc-ov__h">实名认证</h3>
        </div>
        <p class="uc-ov__desc">
          <span v-if="overview" class="uc-ov__pill" :class="kycClass(overview.kycStatus)">
            {{ kycLabel(overview.kycStatus) }}
            <template v-if="(overview.kycTier ?? 0) >= 1"> · Lv.{{ overview.kycTier }}</template>
          </span>
          <span class="uc-ov__reserve">完成认证可提升额度并解锁法币/C2C 等能力（演示）。</span>
        </p>
        <button type="button" class="uc-ov__link" @click="goKyc">前往认证</button>
      </div>
    </div>

    <!-- 安全项矩阵 -->
    <section class="uc-ov__sec-section" aria-label="安全项概览">
      <div class="uc-ov__sec-head">
        <h3 class="uc-ov__sec-title">安全保护</h3>
        <button type="button" class="uc-ov__sec-more" @click="goSecurity">管理全部</button>
      </div>
      <div class="uc-ov__sec-grid">
        <button
          v-for="it in overviewSecurityItems"
          :key="it.id"
          type="button"
          class="uc-ov__sec-cell"
          @click="onSecurityItemAction(it)"
        >
          <span class="uc-ov__sec-ic-wrap">
            <component :is="iconForSecurity(it)" class="uc-ov__sec-ic" />
          </span>
          <span class="uc-ov__sec-name">{{ it.title }}</span>
          <span class="uc-ov__sec-st">
            <span class="uc-ov__sd" :class="statusDotClass(it)" />
            {{ it.statusLabel }}
          </span>
        </button>
      </div>
    </section>

    <!-- 最近会话 -->
    <div v-if="lastLogin" class="uc-ov__session">
      <div class="uc-ov__session-main">
        <Monitor class="uc-ov__session-ic" aria-hidden="true" />
        <div>
          <p class="uc-ov__session-t">最近登录</p>
          <p class="uc-ov__session-v">{{ lastLogin.at }} · IP {{ lastLogin.ip }}</p>
        </div>
      </div>
      <p v-if="prevLogin" class="uc-ov__session-sub">上次：{{ prevLogin.at }} · {{ prevLogin.device }}</p>
      <button type="button" class="uc-ov__session-link" @click="goLoginHistory">查看登录历史</button>
    </div>

    <div v-if="overview?.securityTips?.length" class="uc-ov__alert" role="status">
      <el-icon class="uc-ov__alert-icon" :size="22"><InfoFilled /></el-icon>
      <div>
        <p class="uc-ov__alert-title">安全建议</p>
        <ul class="uc-ov__tips">
          <li v-for="(tip, i) in overview.securityTips" :key="i">{{ tip }}</li>
        </ul>
      </div>
    </div>

    <div class="uc-ov__actions">
      <button type="button" class="uc-ov__btn uc-ov__btn--primary" @click="goSecurity">安全中心</button>
      <button type="button" class="uc-ov__btn uc-ov__btn--secondary" @click="goAssets">资产中心</button>
      <button type="button" class="uc-ov__btn uc-ov__btn--ghost" @click="goPreferences">偏好设置</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.uc-ov__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-3;
  margin-bottom: $space-4;
}

.uc-ov__title {
  margin: 0 0 $space-1;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
}

.uc-ov__lead {
  margin: 0;
  max-width: 520px;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  line-height: 1.55;
}

.uc-ov__head-link {
  flex-shrink: 0;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-brand;
  text-decoration: none;
  padding: 6px 12px;
  border-radius: $radius-md;
  border: 1px solid rgba(240, 185, 11, 0.35);
  background: rgba(240, 185, 11, 0.08);
  transition:
    background 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    background: rgba(240, 185, 11, 0.14);
    border-color: rgba(240, 185, 11, 0.5);
  }
}

/* Bento */
.uc-ov__bento {
  display: grid;
  grid-template-columns: 1fr;
  gap: $space-3;
  margin-bottom: $space-5;

  @include mq.media-up(md) {
    grid-template-columns: minmax(200px, 1fr) minmax(220px, 1.2fr);
    grid-template-areas:
      'security assets'
      'quick quick';
  }

  @include mq.media-up(lg) {
    grid-template-columns: minmax(220px, 0.95fr) minmax(260px, 1.15fr) minmax(200px, 0.9fr);
    grid-template-areas: 'security assets quick';
  }
}

.uc-ov__tile {
  position: relative;
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
  box-shadow: 0 1px 0 color-mix(in srgb, var(--ex-text-primary) 4%, transparent);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.5;
    background: radial-gradient(120% 80% at 100% 0%, rgba(240, 185, 11, 0.07), transparent 55%);
  }

  &--assets::before {
    background: radial-gradient(120% 80% at 0% 0%, rgba(48, 132, 252, 0.08), transparent 55%);
  }

  &--quick::before {
    background: radial-gradient(100% 100% at 50% 100%, rgba(240, 185, 11, 0.06), transparent 50%);
  }

  @include mq.media-up(md) {
    &--security {
      grid-area: security;
    }
    &--assets {
      grid-area: assets;
    }
    &--quick {
      grid-area: quick;
    }
  }
}

.uc-ov__tile-label {
  margin: 0 0 $space-2;
  font-size: 11px;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: $color-text-tertiary;
}

.uc-ov__tile-head {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-1;
}

.uc-ov__tile-ic {
  width: 18px;
  height: 18px;
  color: $color-brand;
}

.uc-ov__dial-wrap {
  position: relative;
  width: 112px;
  height: 112px;
  margin: 0 auto $space-3;
}

.uc-ov__dial {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.uc-ov__dial-track {
  fill: none;
  stroke: var(--ex-border-subtle);
  stroke-width: 8;
}

.uc-ov__dial-prog {
  fill: none;
  stroke: var(--ex-brand);
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;
}

.uc-ov__dial-core {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.uc-ov__score {
  font-size: 28px;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  line-height: 1;
}

.uc-ov__score-unit {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  margin-top: 2px;
}

.uc-ov__dial-meta {
  text-align: center;
  position: relative;
  z-index: 1;
}

.uc-ov__lv {
  display: inline-block;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  margin-bottom: $space-2;
}

.uc-ov__lv--high {
  color: $color-rise;
}
.uc-ov__lv--mid {
  color: $color-brand;
}
.uc-ov__lv--low {
  color: $color-fall;
}
.uc-ov__lv--na {
  color: $color-text-tertiary;
}

.uc-ov__dial-hint {
  margin: 0 0 $space-3;
  font-size: 11px;
  line-height: 1.5;
  color: $color-text-tertiary;
}

.uc-ov__tile-btn {
  width: 100%;
  min-height: 36px;
  padding: 0 $space-3;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: var(--ex-on-brand);
  background: var(--ex-brand);
  border: 1px solid color-mix(in srgb, var(--ex-brand) 45%, transparent);
  border-radius: $radius-md;
  cursor: pointer;
  position: relative;
  z-index: 1;

  &:hover:not(:disabled) {
    background: var(--ex-brand-hover);
  }

  &--ghost {
    margin-top: $space-2;
    color: $color-text-primary;
    background: var(--ex-fill-ghost);
    border-color: $color-border-strong;
  }

  &--ghost:hover {
    background: var(--ex-fill-hover-subtle);
  }
}

.uc-ov__asset-total {
  margin: 0 0 $space-3;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  position: relative;
  z-index: 1;
}

.uc-ov__asset-unit {
  margin-left: 6px;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
}

.uc-ov__asset-fallback {
  margin: 0 0 $space-3;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  position: relative;
  z-index: 1;
}

.uc-ov__dist {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: $space-2;
  position: relative;
  z-index: 1;
}

.uc-ov__dist-row {
  display: grid;
  grid-template-columns: 40px 1fr 72px;
  align-items: center;
  gap: $space-2;
  font-size: 11px;
}

.uc-ov__dist-lab {
  color: $color-text-tertiary;
}

.uc-ov__dist-bar-wrap {
  height: 6px;
  border-radius: 3px;
  background: var(--ex-surface-inset-strong);
  overflow: hidden;
}

.uc-ov__dist-bar {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, rgba(48, 132, 252, 0.35), rgba(48, 132, 252, 0.85));
  min-width: 4px;
  transition: width 0.35s ease;
}

.uc-ov__dist-val {
  text-align: right;
  color: $color-text-secondary;
  font-size: 10px;
}

.uc-ov__quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $space-2;
  margin-bottom: $space-3;
  position: relative;
  z-index: 1;
}

.uc-ov__quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: $space-3 $space-2;
  border-radius: $radius-md;
  border: 1px solid var(--ex-border-subtle);
  background: var(--ex-surface-inset);
  color: $color-text-primary;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;

  &:hover {
    border-color: rgba(240, 185, 11, 0.35);
    background: rgba(240, 185, 11, 0.06);
  }
}

.uc-ov__quick-ic {
  display: flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  background: rgba(240, 185, 11, 0.12);
  color: $color-brand;
  font-size: 16px;
}

.uc-ov__quick-txt {
  font-size: 11px;
  font-weight: $font-weight-bold;
}

.uc-ov__quick-links {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.uc-ov__ql {
  font-size: 11px;
  font-weight: $font-weight-semibold;
  color: var(--ex-info);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  &--btn {
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    font: inherit;
  }
}

/* Contact / KYC cards */
.uc-ov__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: $space-4;
  margin-bottom: $space-5;
}

.uc-ov__card {
  padding: $space-4;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: var(--ex-card-surface);
  box-shadow: 0 1px 0 color-mix(in srgb, var(--ex-text-primary) 4%, transparent);
}

.uc-ov__card-head {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-3;
}

.uc-ov__card-ic {
  width: 18px;
  height: 18px;
  color: $color-text-secondary;
}

.uc-ov__h {
  margin: 0;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.uc-ov__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.uc-ov__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding: $space-2 0;
  border-bottom: 1px solid var(--ex-border-subtle);
  font-size: $font-size-sm;
}

.uc-ov__row:last-child {
  border-bottom: none;
}

.uc-ov__k {
  color: $color-text-tertiary;
}

.uc-ov__pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  padding: 4px 10px;
  border-radius: $radius-sm;
}

.uc-ov__pill-ic {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.uc-ov__pill--ok {
  color: $color-rise;
  background: $color-rise-bg;
}

.uc-ov__pill--bad {
  color: $color-fall;
  background: $color-fall-bg;
}

.uc-ov__pill--muted {
  color: $color-text-tertiary;
  background: var(--ex-fill-hover-subtle);
}

.uc-ov__pill--pend {
  color: $color-brand;
  background: $color-brand-muted;
}

.uc-ov__desc {
  margin: 0 0 $space-2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2;
}

.uc-ov__reserve {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.uc-ov__link {
  padding: 0;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: var(--ex-info);
  background: none;
  border: none;
  cursor: pointer;
}

.uc-ov__link:hover {
  text-decoration: underline;
}

/* Security grid */
.uc-ov__sec-section {
  margin-bottom: $space-5;
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid var(--ex-border-subtle);
  background: linear-gradient(165deg, var(--ex-surface-inset) 0%, var(--ex-card-surface) 48%);
}

.uc-ov__sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-3;
}

.uc-ov__sec-title {
  margin: 0;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.uc-ov__sec-more {
  padding: 4px 10px;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-brand;
  background: rgba(240, 185, 11, 0.1);
  border: 1px solid rgba(240, 185, 11, 0.25);
  border-radius: $radius-sm;
  cursor: pointer;

  &:hover {
    background: rgba(240, 185, 11, 0.16);
  }
}

.uc-ov__sec-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-2;

  @include mq.media-up(sm) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.uc-ov__sec-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: $space-3;
  text-align: left;
  border-radius: $radius-md;
  border: 1px solid var(--ex-border-subtle);
  background: var(--ex-card-surface);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    border-color: rgba(240, 185, 11, 0.28);
    box-shadow: 0 0 0 1px rgba(240, 185, 11, 0.08);
  }
}

.uc-ov__sec-ic-wrap {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  background: var(--ex-surface-inset-strong);
  color: $color-text-secondary;
}

.uc-ov__sec-ic {
  width: 18px;
  height: 18px;
}

.uc-ov__sec-name {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.uc-ov__sec-st {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: $color-text-tertiary;
}

.uc-ov__sd {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.uc-ov__sd--on {
  background: $color-rise;
  box-shadow: 0 0 0 2px $color-rise-bg;
}

.uc-ov__sd--partial {
  background: $color-brand;
  box-shadow: 0 0 0 2px $color-brand-muted;
}

.uc-ov__sd--off {
  background: $color-text-tertiary;
  opacity: 0.7;
}

/* Session */
.uc-ov__session {
  margin-bottom: $space-5;
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid var(--ex-accent-border);
  background: color-mix(in srgb, var(--ex-brand) 5%, var(--ex-card-surface));
}

.uc-ov__session-main {
  display: flex;
  align-items: flex-start;
  gap: $space-3;
}

.uc-ov__session-ic {
  width: 22px;
  height: 22px;
  color: $color-brand;
  flex-shrink: 0;
  margin-top: 2px;
}

.uc-ov__session-t {
  margin: 0 0 4px;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
}

.uc-ov__session-v {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.5;
  font-family: $font-family-mono;
}

.uc-ov__session-sub {
  margin: $space-2 0 0;
  padding-left: calc(22px + #{$space-3});
  font-size: 10px;
  color: $color-text-tertiary;
  line-height: 1.45;
}

.uc-ov__session-link {
  margin-top: $space-3;
  margin-left: calc(22px + #{$space-3});
  padding: 0;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-brand;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* Alert */
.uc-ov__alert {
  display: flex;
  gap: $space-3;
  padding: $space-3 $space-4;
  margin-bottom: $space-5;
  border-radius: $radius-md;
  border: 1px solid rgba(48, 132, 252, 0.35);
  background: rgba(48, 132, 252, 0.08);
}

.uc-ov__alert-icon {
  flex-shrink: 0;
  color: #8ab4ff;
}

.uc-ov__alert-title {
  margin: 0 0 $space-1;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: #a8c7ff;
}

.uc-ov__tips {
  margin: 0;
  padding-left: $space-4;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.55;
}

/* Actions */
.uc-ov__actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  padding-top: $space-4;
  border-top: 1px solid var(--ex-border-subtle);
}

.uc-ov__btn {
  min-height: 40px;
  padding: 0 $space-5;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  border-radius: $radius-md;
  cursor: pointer;
  border: 1px solid transparent;
}

.uc-ov__btn--primary {
  color: var(--ex-on-brand);
  background: var(--ex-brand);
  border-color: color-mix(in srgb, var(--ex-brand) 45%, transparent);
}

.uc-ov__btn--primary:hover {
  background: var(--ex-brand-hover);
}

.uc-ov__btn--secondary {
  color: $color-text-primary;
  background: $color-bg-surface;
  border-color: $color-border-strong;
}

.uc-ov__btn--ghost {
  color: $color-text-secondary;
  background: transparent;
  border-color: var(--ex-border-strong);
}

.ex-num {
  font-family: $font-family-mono;
  font-variant-numeric: tabular-nums;
}
</style>
