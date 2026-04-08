<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import type { C2cOrder, C2cOrderStatus, C2cPaymentLine } from '@/types/c2c'
import { useAppStore } from '@/stores/app'
import C2CAppealModal from '@/components/business/c2c/C2CAppealModal.vue'
import C2CAppealProgressPanel from '@/components/business/c2c/C2CAppealProgressPanel.vue'
import C2COrderChatPanel from '@/components/business/c2c/C2COrderChatPanel.vue'
import { formatPrice } from '@/utils/format/number'

const app = useAppStore()

const props = defineProps<{
  modelValue: boolean
  order: C2cOrder | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'mark-paid'): void
  (e: 'release'): void
  (e: 'cancel'): void
  (e: 'appeal-submitted'): void
}>()

const appealFormOpen = ref(false)

type DetailTab = 'info' | 'chat' | 'appeal'

const detailTab = ref<DetailTab>('info')

const now = ref(Date.now())
let tick: ReturnType<typeof setInterval> | null = null

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      detailTab.value = props.order?.status === 'appeal' ? 'appeal' : 'info'
      now.value = Date.now()
      if (tick) clearInterval(tick)
      tick = setInterval(() => {
        now.value = Date.now()
      }, 1000)
    } else {
      appealFormOpen.value = false
      if (tick) {
        clearInterval(tick)
        tick = null
      }
    }
  },
)

/** 待放币提交申诉后自动切到「申诉」；撤诉回到待放币时回到「订单信息」避免空申诉页误导 */
watch(
  () => props.order?.status,
  (st, prev) => {
    if (!props.modelValue || !st) return
    if (st === 'appeal' && prev && prev !== 'appeal') {
      detailTab.value = 'appeal'
    }
    if (st === 'pending_release' && prev === 'appeal') {
      detailTab.value = 'info'
    }
  },
)

onUnmounted(() => {
  if (tick) clearInterval(tick)
})

const deadlineLeftSec = computed(() => {
  const o = props.order
  if (!o?.payDeadlineAt || o.status !== 'pending_payment') return null
  const end = new Date(o.payDeadlineAt).getTime()
  const s = Math.max(0, Math.floor((end - now.value) / 1000))
  return s
})

function fmtCountdown(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function statusLabel(st: C2cOrderStatus) {
  const map: Record<C2cOrderStatus, string> = {
    pending_payment: '待付款',
    pending_release: '待放币',
    completed: '已完成',
    cancelled: '已取消',
    appeal: '申诉中',
  }
  return map[st]
}

function payLabel(m: string) {
  if (m === 'bank') return '银行卡'
  if (m === 'alipay') return '支付宝'
  if (m === 'wechat') return '微信'
  return m
}

function close() {
  emit('update:modelValue', false)
}

function payLineSummary(line: C2cPaymentLine) {
  const parts = [payLabel(line.method), line.bankName, line.accountMask, line.holder].filter(Boolean)
  if (line.transferMemo) parts.push(`备注:${line.transferMemo}`)
  return parts.join(' · ')
}

async function copyPayLine(line: C2cPaymentLine) {
  const text = payLineSummary(line)
  try {
    await navigator.clipboard.writeText(text)
    app.pushToast('success', '已复制收款信息')
  } catch {
    app.pushToast('error', '复制失败，请手动选择复制')
  }
}

/** 待付款 / 待放币 / 申诉：展示买卖家聊天（参考币安 P2P） */
const showOrderChat = computed(() => {
  const st = props.order?.status
  return st === 'pending_payment' || st === 'pending_release' || st === 'appeal'
})

const steps = computed(() => {
  const o = props.order
  if (!o) return []
  const st = o.status
  const payLab = o.userSide === 'buy' ? '向卖家付款' : '买家付款（待确认）'
  const relLab = o.userSide === 'buy' ? '卖家放币' : '您放币'
  const endLab = st === 'cancelled' ? '已取消' : st === 'appeal' ? '申诉/客服处理' : '完成'
  return [
    { key: 'p', label: '创建订单', done: true, active: false },
    { key: 'pay', label: payLab, done: st !== 'pending_payment', active: st === 'pending_payment' },
    {
      key: 'rel',
      label: relLab,
      /* 申诉是「待放币」争议产生的，不应把「放币」标为已完成 */
      done: st === 'completed',
      active: st === 'pending_release',
    },
    {
      key: 'end',
      label: endLab,
      done: st === 'completed' || st === 'cancelled',
      active: st === 'appeal',
    },
  ]
})

function onAppealFormSubmitted() {
  emit('appeal-submitted')
}

function onAppealProgressUpdated() {
  emit('appeal-submitted')
}

const appealTabHint = computed(() => {
  const o = props.order
  if (!o) return ''
  if (o.status === 'appeal') return ''
  if (o.status === 'completed' || o.status === 'cancelled') {
    return '订单已结束，无需发起申诉。'
  }
  if (o.status === 'pending_payment') {
    return '付款阶段建议先通过「对话」与对方沟通；如遇异常可取消订单后重新下单（演示）。'
  }
  if (o.status === 'pending_release') {
    return '若对方超时未放币或对付款有争议，可发起申诉由客服协助（演示）。'
  }
  return ''
})

function openAppealFromTab() {
  appealFormOpen.value = true
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && order"
      class="c2c-od-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="订单详情"
      @click.self="close"
    >
      <div class="c2c-od">
        <div class="c2c-od__head">
          <div class="c2c-od__head-txt">
            <span class="c2c-od__title">订单详情</span>
            <p class="c2c-od__id">{{ order.id }}</p>
          </div>
          <button type="button" class="c2c-od__x" aria-label="关闭" @click="close">×</button>
        </div>

        <div class="c2c-od__tabs" role="tablist" aria-label="订单详情分区">
          <button
            type="button"
            role="tab"
            class="c2c-od__tab"
            :class="{ 'c2c-od__tab--on': detailTab === 'info' }"
            :aria-selected="detailTab === 'info'"
            @click="detailTab = 'info'"
          >
            订单信息
          </button>
          <button
            type="button"
            role="tab"
            class="c2c-od__tab"
            :class="{ 'c2c-od__tab--on': detailTab === 'chat' }"
            :aria-selected="detailTab === 'chat'"
            @click="detailTab = 'chat'"
          >
            对话
          </button>
          <button
            type="button"
            role="tab"
            class="c2c-od__tab"
            :class="{ 'c2c-od__tab--on': detailTab === 'appeal' }"
            :aria-selected="detailTab === 'appeal'"
            @click="detailTab = 'appeal'"
          >
            申诉
          </button>
        </div>

        <div class="c2c-od__body">
          <div v-show="detailTab === 'info'" class="c2c-od__panel" role="tabpanel">
            <div class="c2c-od__badge" :data-st="order.status">{{ statusLabel(order.status) }}</div>

            <div v-if="order.status === 'pending_payment' && deadlineLeftSec != null" class="c2c-od__cd">
              请在 <strong class="ex-num">{{ fmtCountdown(deadlineLeftSec) }}</strong> 内完成付款（演示 15 分钟）
            </div>

            <div class="c2c-od__steps">
              <div
                v-for="(s, i) in steps"
                :key="s.key"
                class="c2c-od__step"
                :class="{
                  'c2c-od__step--done': s.done,
                  'c2c-od__step--active': s.active,
                }"
              >
                <span class="c2c-od__dot">{{ i + 1 }}</span>
                <span class="c2c-od__slab">{{ s.label }}</span>
              </div>
            </div>

            <div class="c2c-od__grid">
              <div class="c2c-od__cell">
                <span class="c2c-od__k">类型</span>
                <span class="c2c-od__v">{{ order.userSide === 'buy' ? '买入' : '卖出' }} {{ order.crypto }}</span>
              </div>
              <div class="c2c-od__cell">
                <span class="c2c-od__k">单价</span>
                <span class="c2c-od__v ex-num">{{ formatPrice(order.price) }} {{ order.fiat }}</span>
              </div>
              <div class="c2c-od__cell">
                <span class="c2c-od__k">法币金额</span>
                <span class="c2c-od__v ex-num">{{ formatPrice(order.fiatAmount) }} {{ order.fiat }}</span>
              </div>
              <div class="c2c-od__cell">
                <span class="c2c-od__k">数字币数量</span>
                <span class="c2c-od__v ex-num">{{ formatPrice(order.cryptoAmount) }} {{ order.crypto }}</span>
              </div>
              <div class="c2c-od__cell c2c-od__cell--full">
                <span class="c2c-od__k">交易对手</span>
                <span class="c2c-od__v">{{ order.merchantDisplayName }}（{{ order.counterpartyMasked }}）</span>
              </div>
              <div class="c2c-od__cell c2c-od__cell--full">
                <span class="c2c-od__k">付款方式</span>
                <span class="c2c-od__v">
                  <span v-for="m in order.methods" :key="m" class="c2c-od__chip">{{ payLabel(m) }}</span>
                </span>
              </div>
            </div>

            <section
              v-if="order.status === 'pending_payment' && order.userSide === 'buy' && order.sellerPayments?.length"
              class="c2c-od__paysec"
              aria-label="卖家收款方式"
            >
              <h3 class="c2c-od__paysec-title">向卖家付款</h3>
              <p class="c2c-od__paysec-sub">请按下列任一方式转账，务必核对金额与备注；勿在备注中写敏感词。</p>
              <ul class="c2c-od__paylist">
                <li v-for="(line, idx) in order.sellerPayments" :key="idx" class="c2c-od__paycard">
                  <div class="c2c-od__paycard-top">
                    <span class="c2c-od__paytag">{{ payLabel(line.method) }}</span>
                    <button type="button" class="c2c-od__copy" @click="copyPayLine(line)">复制</button>
                  </div>
                  <p v-if="line.bankName" class="c2c-od__payrow">
                    <span class="c2c-od__payk">开户行</span>
                    <span class="c2c-od__payv">{{ line.bankName }}</span>
                  </p>
                  <p class="c2c-od__payrow">
                    <span class="c2c-od__payk">账号</span>
                    <span class="c2c-od__payv ex-num">{{ line.accountMask }}</span>
                  </p>
                  <p class="c2c-od__payrow">
                    <span class="c2c-od__payk">户名</span>
                    <span class="c2c-od__payv">{{ line.holder }}</span>
                  </p>
                  <p v-if="line.transferMemo" class="c2c-od__payrow">
                    <span class="c2c-od__payk">转账备注</span>
                    <span class="c2c-od__payv ex-num">{{ line.transferMemo }}</span>
                  </p>
                </li>
              </ul>
            </section>

            <div
              v-if="order.status === 'pending_payment' && order.userSide === 'buy'"
              class="c2c-od__hint"
            >
              转账完成后请点击「我已付款」；超时未付订单将自动取消（演示为手动取消）。
            </div>
            <div
              v-if="order.status === 'pending_payment' && order.userSide === 'sell'"
              class="c2c-od__hint c2c-od__hint--sell"
            >
              您为卖方：已在现货账户冻结
              <span class="ex-num">{{ formatPrice(order.cryptoAmount) }} {{ order.crypto }}</span>
              。请等待买家付款；您可取消订单以解冻资产（演示）。
            </div>
            <div
              v-if="order.status === 'pending_release' && order.userSide === 'buy'"
              class="c2c-od__hint"
            >
              已标记付款，等待卖家放币。演示环境可点击「模拟对方已放币」完成流程。
            </div>
            <div
              v-if="order.status === 'pending_release' && order.userSide === 'sell'"
              class="c2c-od__hint c2c-od__hint--sell"
            >
              买家已标记付款，请核对收款记录后放币。演示可一键「模拟确认收款并放币」。
            </div>
          </div>

          <div
            v-show="detailTab === 'chat'"
            class="c2c-od__panel c2c-od__panel--chat"
            role="tabpanel"
          >
            <C2COrderChatPanel
              v-if="showOrderChat"
              :order-id="order.id"
              :merchant-display-name="order.merchantDisplayName"
              :counterparty-masked="order.counterpartyMasked"
              :user-side="order.userSide"
              :fiat-amount="order.fiatAmount"
              :fiat="order.fiat"
              :crypto-amount="order.cryptoAmount"
              :crypto="order.crypto"
              :interactive="showOrderChat"
            />
            <div v-else class="c2c-od__empty">
              <p class="c2c-od__empty-title">暂无进行中会话</p>
              <p class="c2c-od__empty-desc">仅待付款、待放币、申诉中的订单可在此与对方沟通；已结束订单不展示聊天（演示）。</p>
            </div>
          </div>

          <div v-show="detailTab === 'appeal'" class="c2c-od__panel" role="tabpanel">
            <C2CAppealProgressPanel
              v-if="order.status === 'appeal'"
              :order-id="order.id"
              @updated="onAppealProgressUpdated"
            />
            <div v-else class="c2c-od__appeal-placeholder">
              <p class="c2c-od__appeal-placeholder-txt">{{ appealTabHint }}</p>
              <button
                v-if="order.status === 'pending_release'"
                type="button"
                class="c2c-od__appeal-cta"
                @click="openAppealFromTab"
              >
                发起申诉
              </button>
            </div>
          </div>
        </div>

        <div class="c2c-od__foot">
          <template v-if="order.status === 'pending_payment'">
            <template v-if="order.userSide === 'buy'">
              <button type="button" class="c2c-od__btn c2c-od__btn--ghost" @click="emit('cancel')">取消订单</button>
              <button type="button" class="c2c-od__btn c2c-od__btn--primary" @click="emit('mark-paid')">
                我已付款
              </button>
            </template>
            <template v-else>
              <button type="button" class="c2c-od__btn c2c-od__btn--ghost" @click="emit('cancel')">取消订单（解冻）</button>
              <button type="button" class="c2c-od__btn c2c-od__btn--primary" @click="emit('mark-paid')">
                模拟买家已付款（演示）
              </button>
            </template>
          </template>
          <template v-else-if="order.status === 'pending_release'">
            <button type="button" class="c2c-od__btn c2c-od__btn--ghost" @click="appealFormOpen = true">申诉</button>
            <button type="button" class="c2c-od__btn c2c-od__btn--primary" @click="emit('release')">
              {{ order.userSide === 'buy' ? '模拟对方已放币' : '模拟确认收款并放币' }}
            </button>
          </template>
          <template v-else-if="order.status === 'appeal'">
            <button type="button" class="c2c-od__btn c2c-od__btn--ghost" @click="close">关闭</button>
          </template>
          <template v-else>
            <button type="button" class="c2c-od__btn c2c-od__btn--ghost" @click="close">关闭</button>
          </template>
        </div>
      </div>
    </div>
  </Teleport>

  <C2CAppealModal v-model="appealFormOpen" :order="order" @submitted="onAppealFormSubmitted" />
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.c2c-od-overlay {
  position: fixed;
  inset: 0;
  /* 高于粘性顶栏（~1000），避免被主导航遮挡 */
  z-index: $z-modal;
  background: var(--ex-overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  /* 顶栏下方留白后，在剩余视口内垂直居中 */
  padding: calc(var(--ex-header-height, #{$header-height}) + 16px)
    max(16px, env(safe-area-inset-right, 0px)) max(16px, env(safe-area-inset-bottom, 0px))
    max(16px, env(safe-area-inset-left, 0px));
  overflow-y: auto;
  box-sizing: border-box;
}

.c2c-od {
  width: 100%;
  /* 整体缩小 1/8（×7/8），原宽约 680px → 595px */
  max-width: min(595px, calc(100vw - 32px));
  margin: 0 auto;
  /* 高度同步缩减，并限制在顶栏以下的可视区内 */
  max-height: min(calc((100dvh - var(--ex-header-height, #{$header-height}) - 40px) * 0.88), 752px);
  border-radius: 10px;
  border: 1px solid $color-border;
  background: var(--ex-card-surface);
  box-shadow: var(--ex-modal-shadow-elevated);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.c2c-od__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-2;
  padding: 10px $space-3;
  border-bottom: 1px solid $color-border;
  flex-shrink: 0;
}

.c2c-od__head-txt {
  min-width: 0;
}

.c2c-od__title {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.c2c-od__id {
  margin: 4px 0 0;
  font-size: 11px;
  color: $color-text-tertiary;
  font-family: $font-family-mono;
  word-break: break-all;
  line-height: 1.35;
}

.c2c-od__x {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  padding: 4px;
  border-radius: $radius-sm;
}

.c2c-od__x:hover {
  color: $color-text-primary;
  background: var(--ex-fill-hover-subtle);
}

.c2c-od__tabs {
  display: flex;
  flex-shrink: 0;
  gap: 4px;
  padding: $space-2 $space-4 0;
  border-bottom: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.c2c-od__tab {
  position: relative;
  border: none;
  background: transparent;
  padding: 10px 14px 12px;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-tertiary;
  cursor: pointer;
  border-radius: $radius-sm $radius-sm 0 0;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}

.c2c-od__tab:hover:not(:disabled) {
  color: $color-text-primary;
  background: var(--ex-fill-hover-subtle);
}

.c2c-od__tab--on {
  color: $color-brand;
  background: var(--ex-card-surface);
  box-shadow: 0 1px 0 0 var(--ex-card-surface);
}

.c2c-od__tab--on::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 0;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, $color-brand, transparent);
}

.c2c-od__body {
  flex: 1;
  min-height: 0;
  padding: 10px $space-3;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.c2c-od__panel {
  min-height: 0;
}

.c2c-od__panel--chat :deep(.c2c-chat) {
  padding: $space-2 $space-3;
}

.c2c-od__panel--chat :deep(.c2c-chat__list) {
  max-height: min(36vh, 350px);
  min-height: 120px;
}

.c2c-od__empty {
  padding: $space-6 $space-4;
  text-align: center;
  border-radius: $radius-md;
  border: 1px dashed $color-border;
  background: var(--ex-surface-inset);
}

.c2c-od__empty-title {
  margin: 0 0 $space-2;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-secondary;
}

.c2c-od__empty-desc {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
  line-height: 1.5;
}

.c2c-od__appeal-placeholder {
  padding: $space-4;
  border-radius: $radius-md;
  border: 1px solid var(--ex-border-subtle);
  background: var(--ex-surface-inset);
}

.c2c-od__appeal-placeholder-txt {
  margin: 0 0 $space-3;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: 1.55;
}

.c2c-od__appeal-cta {
  padding: 8px 18px;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  border: none;
  border-radius: $radius-sm;
  background: rgba(240, 185, 11, 0.15);
  color: $color-brand;
  cursor: pointer;
  border: 1px solid rgba(240, 185, 11, 0.35);
}

.c2c-od__appeal-cta:hover {
  background: rgba(240, 185, 11, 0.22);
}

.c2c-od__badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: $radius-sm;
  font-size: 11px;
  font-weight: $font-weight-bold;
  margin-bottom: $space-3;
  background: var(--ex-fill-hover-subtle);
  color: $color-text-secondary;

  &[data-st='pending_payment'] {
    background: rgba(240, 185, 11, 0.15);
    color: $color-brand;
  }

  &[data-st='pending_release'] {
    background: rgba(48, 132, 252, 0.12);
    color: #5b8cff;
  }

  &[data-st='completed'] {
    background: rgba(14, 203, 129, 0.12);
    color: $color-rise;
  }

  &[data-st='cancelled'] {
    opacity: 0.75;
  }

  &[data-st='appeal'] {
    background: rgba(246, 70, 93, 0.12);
    color: $color-fall;
  }
}

.c2c-od__cd {
  font-size: $font-size-sm;
  color: $color-text-secondary;
  margin-bottom: $space-3;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.25);
  background: rgba(240, 185, 11, 0.06);
}

.c2c-od__steps {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: $space-3;
}

@media (min-width: 520px) {
  .c2c-od__steps {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.c2c-od__step {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 11px;
  line-height: 1.35;
  color: $color-text-tertiary;
  padding: $space-2;
  border-radius: $radius-sm;
  background: var(--ex-fill-ghost);
  border: 1px solid transparent;

  &--active {
    color: $color-text-primary;
    border-color: rgba(240, 185, 11, 0.35);
    background: rgba(240, 185, 11, 0.06);
  }

  &--done .c2c-od__dot {
    background: rgba(14, 203, 129, 0.25);
    color: $color-rise;
  }
}

.c2c-od__dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: $font-weight-bold;
  background: var(--ex-fill-hover-subtle);
  flex-shrink: 0;
}

.c2c-od__slab {
  flex: 1;
  min-width: 0;
}

.c2c-od__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-2;
  margin-bottom: $space-3;
}

.c2c-od__cell {
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  background: var(--ex-surface-inset);
  border: 1px solid var(--ex-border-subtle);

  &--full {
    grid-column: 1 / -1;
  }
}

.c2c-od__k {
  display: block;
  font-size: 10px;
  color: $color-text-tertiary;
  margin-bottom: 4px;
}

.c2c-od__v {
  font-size: $font-size-sm;
  color: $color-text-primary;
}

.c2c-od__chip {
  display: inline-block;
  margin-right: 6px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--ex-fill-hover-subtle);
  font-size: 11px;
}

.c2c-od__hint {
  font-size: 11px;
  color: $color-text-secondary;
  line-height: 1.5;
  padding: $space-2;
  border-left: 3px solid rgba(240, 185, 11, 0.4);
  background: var(--ex-fill-ghost);

  &--sell {
    border-left-color: rgba(48, 132, 252, 0.45);
    background: rgba(48, 132, 252, 0.06);
  }
}

.c2c-od__paysec {
  margin-bottom: $space-3;
  padding: $space-3;
  border-radius: $radius-sm;
  border: 1px solid var(--ex-border);
  background: var(--ex-panel-sunken);
}

.c2c-od__paysec-title {
  margin: 0 0 6px;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.c2c-od__paysec-sub {
  margin: 0 0 $space-3;
  font-size: 11px;
  color: $color-text-tertiary;
  line-height: 1.45;
}

.c2c-od__paylist {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.c2c-od__paycard {
  margin: 0;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-fill-ghost);
}

.c2c-od__paycard-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.c2c-od__paytag {
  font-size: 11px;
  font-weight: $font-weight-bold;
  color: $color-brand;
}

.c2c-od__copy {
  padding: 4px 12px;
  font-size: 11px;
  font-weight: $font-weight-bold;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: rgba(240, 185, 11, 0.12);
  color: $color-brand;
  cursor: pointer;
}

.c2c-od__payrow {
  margin: 0 0 4px;
  font-size: 11px;
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.c2c-od__payk {
  flex: 0 0 4.5em;
  color: $color-text-tertiary;
}

.c2c-od__payv {
  flex: 1;
  color: $color-text-primary;
  word-break: break-all;
}

.c2c-od__foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: $space-2;
  padding: 10px $space-3;
  border-top: 1px solid $color-border;
  flex-shrink: 0;
  background: var(--ex-card-surface);
}

.c2c-od__btn {
  padding: 8px 14px;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  cursor: pointer;
  border: none;
}

.c2c-od__btn--ghost {
  background: transparent;
  color: $color-text-secondary;
  border: 1px solid $color-border;
}

.c2c-od__btn--primary {
  background: $color-brand;
  color: var(--ex-on-brand);
}
</style>
