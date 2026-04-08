<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useAuthStore } from '@/stores/auth'
import { useReferralInviteStore } from '@/stores/referralInvite'
import { formatPrice } from '@/utils/format/number'
import ExPageState from '@/components/common/ExPageState.vue'

const store = useReferralInviteStore()
const auth = useAuthStore()
const { loading, loadError, dashboard, inviteCode, inviteLink } = storeToRefs(store)

const tab = ref<'friends' | 'commissions' | 'rules'>('friends')

watch(
  () => auth.user?.userCode,
  (code) => {
    if (code) void store.bootstrap()
  },
  { immediate: true },
)

function fmtTime(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' })
}

function marketLab(m: string) {
  return m === 'FUTURES' ? '合约' : '现货'
}

function tierProgressPct() {
  const t = dashboard.value?.tier
  if (!t || t.nextLevelNeedInvites == null) return 100
  const target = t.effectiveInvited + t.nextLevelNeedInvites
  if (target <= 0) return 100
  return Math.min(100, Math.round((t.effectiveInvited / target) * 100))
}
</script>

<template>
  <div class="rip">
    <header class="rip__hero">
      <div>
        <h1 class="rip__title">邀请返佣</h1>
        <p class="rip__sub">邀请好友注册并交易，双方共享手续费优惠与返佣（演示数据）</p>
      </div>
      <RouterLink :to="{ name: RouteNames.ActivityCenter }" class="rip__link">活动中心 →</RouterLink>
    </header>

    <ExPageState
      :loading="loading && !dashboard"
      use-skeleton
      skeleton-variant="panel"
      :error="loadError"
      loading-text="加载邀请数据…"
      @retry="store.bootstrap(true)"
    >
      <template v-if="dashboard">
        <!-- 指标 -->
        <div class="rip__stats">
          <div class="rip__stat">
            <span class="rip__sl">累计邀请</span>
            <span class="rip__sv ex-num">{{ dashboard.stats.totalInvited }}</span>
            <span class="rip__su">人</span>
          </div>
          <div class="rip__stat">
            <span class="rip__sl">有效好友</span>
            <span class="rip__sv ex-num rip__sv--accent">{{ dashboard.stats.effectiveInvited }}</span>
            <span class="rip__su">已交易</span>
          </div>
          <div class="rip__stat">
            <span class="rip__sl">累计返佣</span>
            <span class="rip__sv ex-num">{{ formatPrice(dashboard.stats.totalCommissionUsdt) }}</span>
            <span class="rip__su">USDT</span>
          </div>
          <div class="rip__stat">
            <span class="rip__sl">待领取</span>
            <span class="rip__sv ex-num">{{ formatPrice(dashboard.stats.pendingUsdt) }}</span>
            <span class="rip__su">USDT</span>
          </div>
        </div>

        <!-- 等级与比例 -->
        <section class="rip-tier" aria-label="返佣等级">
          <div class="rip-tier__head">
            <h2 class="rip-tier__title">当前等级 · {{ dashboard.tier.name }} Lv{{ dashboard.tier.level }}</h2>
            <p class="rip-tier__rates">
              您的返佣：现货 {{ dashboard.tier.spotRebatePct }}% · 合约 {{ dashboard.tier.futuresRebatePct }}% · 好友折扣
              {{ dashboard.tier.friendDiscountPct }}%
            </p>
          </div>
          <div v-if="dashboard.tier.nextLevelNeedInvites != null" class="rip-tier__prog">
            <div class="rip-tier__prog-top">
              <span>升级进度（有效邀请）</span>
              <span class="ex-num"
                >还需 <b>{{ dashboard.tier.nextLevelNeedInvites }}</b> 人可达下一等级</span
              >
            </div>
            <div class="rip-tier__bar">
              <div class="rip-tier__fill" :style="{ width: `${tierProgressPct()}%` }" />
            </div>
          </div>
          <div v-else class="rip-tier__max">已达最高等级，感谢您对平台的支持</div>
        </section>

        <!-- 邀请码与链接 -->
        <section class="rip-share" aria-label="邀请方式">
          <h2 class="rip-share__title">我的邀请</h2>
          <div class="rip-share__grid">
            <div class="rip-share__box">
              <span class="rip-share__lab">邀请码</span>
              <div class="rip-share__row">
                <code class="rip-share__code">{{ inviteCode }}</code>
                <button type="button" class="rip-share__btn" @click="store.copyText(inviteCode)">复制</button>
              </div>
            </div>
            <div class="rip-share__box">
              <span class="rip-share__lab">邀请链接</span>
              <div class="rip-share__row">
                <input type="text" class="rip-share__input" readonly :value="inviteLink" aria-label="邀请链接" />
                <button type="button" class="rip-share__btn" @click="store.copyText(inviteLink, '邀请链接已复制')">
                  复制链接
                </button>
              </div>
              <p class="rip-share__hint">好友通过链接打开注册页时，邀请码将自动填入（参数名 <code class="rip-share__code--sm">ref</code>）。</p>
            </div>
          </div>
          <div class="rip-share__claim">
            <button
              type="button"
              class="rip-share__claim-btn"
              :disabled="dashboard.stats.pendingUsdt <= 0"
              @click="store.claimPending()"
            >
              领取待结算返佣
            </button>
            <span class="rip-share__claim-hint">已结算 {{ formatPrice(dashboard.stats.settledUsdt) }} USDT（演示）</span>
          </div>
        </section>

        <!-- Tab -->
        <div class="rip__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            class="rip__tab"
            :class="{ 'rip__tab--on': tab === 'friends' }"
            @click="tab = 'friends'"
          >
            邀请记录
          </button>
          <button
            type="button"
            role="tab"
            class="rip__tab"
            :class="{ 'rip__tab--on': tab === 'commissions' }"
            @click="tab = 'commissions'"
          >
            返佣明细
          </button>
          <button
            type="button"
            role="tab"
            class="rip__tab"
            :class="{ 'rip__tab--on': tab === 'rules' }"
            @click="tab = 'rules'"
          >
            规则说明
          </button>
        </div>

        <section v-show="tab === 'friends'" class="rip-table-wrap" aria-label="邀请记录">
          <table class="rip-table">
            <thead>
              <tr>
                <th>账户</th>
                <th>注册时间</th>
                <th>认证</th>
                <th>首笔交易</th>
                <th>30日成交额</th>
                <th>贡献返佣</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in dashboard.invitees" :key="r.id">
                <td class="rip-table__mono">{{ r.maskedAccount }}</td>
                <td>{{ fmtTime(r.registeredAt) }}</td>
                <td>
                  <span class="rip-badge" :class="r.kycDone ? 'rip-badge--ok' : 'rip-badge--wait'">
                    {{ r.kycDone ? '已认证' : '未认证' }}
                  </span>
                </td>
                <td>{{ r.firstTradeAt ? fmtTime(r.firstTradeAt) : '—' }}</td>
                <td class="ex-num">{{ formatPrice(r.volume30dUsdt) }}</td>
                <td class="ex-num">{{ formatPrice(r.contributionUsdt) }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section v-show="tab === 'commissions'" class="rip-table-wrap" aria-label="返佣明细">
          <table class="rip-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>市场</th>
                <th>好友</th>
                <th>返佣 (USDT)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in dashboard.commissions" :key="c.id">
                <td>{{ fmtTime(c.time) }}</td>
                <td>{{ marketLab(c.market) }}</td>
                <td class="rip-table__mono">{{ c.fromMasked }}</td>
                <td class="ex-num rip-table__gain">+{{ formatPrice(c.amountUsdt) }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section v-show="tab === 'rules'" class="rip-rules" aria-label="规则说明">
          <ol class="rip-rules__ol">
            <li>好友须通过您的邀请链接或填写邀请码完成注册，方计入邀请关系（演示逻辑）。</li>
            <li>返佣基于好友现货、合约成交产生的手续费按等级比例计算；具体比例以页面展示为准，平台有权调整。</li>
            <li>「有效好友」一般指完成身份认证并产生过至少一笔真实交易的用户；刷单、对敲等异常行为不计入。</li>
            <li>待结算返佣在风控核对后发放，领取后进入现货账户（演示中为即时模拟到账）。</li>
            <li>若好友与您存在相同设备、相同证件等风险关联，平台可拒绝或追回返佣。</li>
            <li>本页为产品演示，正式规则以《邀请返佣协议》及公告为准。</li>
          </ol>
          <p class="rip-rules__more">
            交互与信息架构参考
            <a class="rip__a" href="https://www.binance.com/zh-CN/activity/referral" target="_blank" rel="noopener noreferrer">币安邀请计划</a>
            。
          </p>
        </section>
      </template>
    </ExPageState>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;
@use '@/styles/mixins' as mq;

.rip {
  max-width: min(1000px, var(--ex-container-max));
  margin: 0 auto;
  padding: 0 $space-4 $space-8;
  box-sizing: border-box;
}

.rip__hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-3;
  margin-bottom: $space-4;
}

.rip__title {
  margin: 0 0 $space-1;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.rip__sub {
  margin: 0;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  line-height: 1.5;
  max-width: 560px;
}

.rip__link {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-brand;
  text-decoration: none;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.35);
  background: rgba(240, 185, 11, 0.08);
}

.rip__link:hover {
  background: rgba(240, 185, 11, 0.14);
}

.rip__stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-2;
  margin-bottom: $space-4;

  @include mq.media-up(md) {
    grid-template-columns: repeat(4, 1fr);
  }
}

.rip__stat {
  padding: $space-3;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
}

.rip__sl {
  display: block;
  font-size: 11px;
  color: $color-text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}

.rip__sv {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.rip__sv--accent {
  color: $color-rise;
}

.rip__su {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  margin-left: 4px;
}

.rip-tier {
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid var(--ex-vip-banner-border, $color-border);
  background: var(--ex-vip-banner-surface);
  margin-bottom: $space-4;
  box-shadow: var(--ex-elevated-panel-shadow);
}

.rip-tier__head {
  margin-bottom: $space-3;
}

.rip-tier__title {
  margin: 0 0 $space-2;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.rip-tier__rates {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.5;
}

.rip-tier__prog-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $space-2;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  margin-bottom: 8px;
}

.rip-tier__bar {
  height: 6px;
  border-radius: 3px;
  background: var(--ex-surface-inset-strong);
  overflow: hidden;
}

.rip-tier__fill {
  height: 100%;
  border-radius: 3px;
  background: var(--ex-brand);
  transition: width 0.35s ease;
}

.rip-tier__max {
  font-size: $font-size-xs;
  color: $color-brand;
  font-weight: $font-weight-semibold;
}

.rip-share {
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
  margin-bottom: $space-4;
}

.rip-share__title {
  margin: 0 0 $space-3;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.rip-share__grid {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.rip-share__box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rip-share__lab {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  font-weight: $font-weight-semibold;
}

.rip-share__row {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  align-items: center;
}

.rip-share__code {
  flex: 1;
  min-width: 140px;
  padding: 10px $space-3;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  font-family: $font-family-mono;
  color: $color-brand;
  background: var(--ex-surface-inset-strong);
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.25);
}

.rip-share__code--sm {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--ex-surface-inset-strong);
}

.rip-share__input {
  flex: 1;
  min-width: 200px;
  padding: 10px $space-3;
  font-size: 11px;
  font-family: $font-family-mono;
  color: $color-text-secondary;
  background: var(--ex-surface-inset-strong);
  border: 1px solid $color-border;
  border-radius: $radius-sm;
}

.rip-share__btn {
  padding: 10px $space-4;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;
  background: var(--ex-brand);
  color: var(--ex-on-brand);
}

.rip-share__btn:hover {
  filter: brightness(1.05);
}

.rip-share__hint {
  margin: $space-2 0 0;
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.rip-share__claim {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-3;
  margin-top: $space-4;
  padding-top: $space-3;
  border-top: 1px solid var(--ex-border-subtle);
}

.rip-share__claim-btn {
  padding: $space-2 $space-4;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  border-radius: $radius-sm;
  border: 1px solid rgba(14, 203, 129, 0.45);
  background: rgba(14, 203, 129, 0.12);
  color: $color-rise;
  cursor: pointer;
}

.rip-share__claim-btn:hover:not(:disabled) {
  background: rgba(14, 203, 129, 0.2);
}

.rip-share__claim-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.rip-share__claim-hint {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.rip__tabs {
  display: flex;
  gap: $space-1;
  margin-bottom: $space-3;
  padding: 4px;
  border-radius: $radius-md;
  background: var(--ex-surface-inset);
  border: 1px solid $color-border;
}

.rip__tab {
  flex: 1;
  padding: $space-2 $space-2;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  background: transparent;
  border: none;
  border-radius: $radius-sm;
  cursor: pointer;
}

.rip__tab--on {
  color: $color-text-primary;
  background: rgba(240, 185, 11, 0.14);
  box-shadow: 0 0 0 1px rgba(240, 185, 11, 0.25);
}

.rip-table-wrap {
  overflow-x: auto;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.rip-table {
  width: 100%;
  border-collapse: collapse;
  font-size: $font-size-xs;
}

.rip-table th,
.rip-table td {
  padding: $space-3 $space-3;
  text-align: left;
  border-bottom: 1px solid var(--ex-border-subtle);
}

.rip-table th {
  color: $color-text-tertiary;
  font-weight: $font-weight-semibold;
  white-space: nowrap;
}

.rip-table td {
  color: $color-text-secondary;
}

.rip-table__mono {
  font-family: $font-family-mono;
  color: $color-text-primary;
}

.rip-table__gain {
  color: $color-rise;
  font-weight: $font-weight-semibold;
}

.rip-badge {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 2px 8px;
  border-radius: 4px;
}

.rip-badge--ok {
  background: rgba(14, 203, 129, 0.15);
  color: $color-rise;
}

.rip-badge--wait {
  background: var(--ex-fill-hover-subtle);
  color: $color-text-tertiary;
}

.rip-rules {
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.rip-rules__ol {
  margin: 0;
  padding-left: 1.25rem;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  line-height: 1.7;
}

.rip-rules__ol li {
  margin-bottom: $space-2;
}

.rip-rules__more {
  margin: $space-4 0 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.rip__a {
  color: $color-brand;
  text-decoration: none;
  font-weight: $font-weight-semibold;
}

.rip__a:hover {
  text-decoration: underline;
}

.ex-num {
  font-family: $font-family-mono;
}
</style>
