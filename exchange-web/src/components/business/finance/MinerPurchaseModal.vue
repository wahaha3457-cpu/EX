<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { MinerProduct } from '@/types/financeEarn'
import { minerDailyYieldPct, minerOrderEstimatedDailyUsdt } from '@/utils/finance/earnYield'
import { formatPrice } from '@/utils/format/number'
import { useSmartMinerStore } from '@/stores/smartMiner'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import MinerOrderSuccessPanel from '@/components/business/finance/MinerOrderSuccessPanel.vue'

const props = defineProps<{
  modelValue: boolean
  product: MinerProduct | null
  walletUsdt: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const app = useAppStore()
const auth = useAuthStore()
const store = useSmartMinerStore()

const phase = ref<'form' | 'confirm' | 'success'>('form')
const qty = ref(1)
const agreed = ref(false)
const orderRefDemo = ref('')
const successAnimKey = ref(0)

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      phase.value = 'form'
      qty.value = 1
      agreed.value = false
      orderRefDemo.value = ''
    }
  },
)

const product = computed(() => props.product)

const dailyYieldPct = computed(() => (product.value ? minerDailyYieldPct(product.value) : 0))

const estDailyOut = computed(() =>
  product.value ? minerOrderEstimatedDailyUsdt(product.value, qty.value) : 0,
)

const total = computed(() => (product.value ? product.value.priceUsdt * qty.value : 0))

const estTotalOut = computed(() =>
  product.value ? product.value.estDailyUsdt * product.value.durationDays * qty.value : 0,
)

const totalHashrate = computed(() => (product.value ? product.value.hashrateTh * qty.value : 0))

const walletAfter = computed(() => Math.max(0, props.walletUsdt - total.value))

const modalTitle = computed(() => {
  if (!product.value) return ''
  if (phase.value === 'success') return '下单结果'
  if (phase.value === 'confirm') return '核对算力订单'
  return `购买算力 · ${product.value.name}`
})

function close() {
  emit('update:modelValue', false)
}

function onOverlayClick() {
  if (phase.value === 'success') return
  close()
}

const canGoConfirm = computed(
  () => !!product.value && agreed.value && total.value > 0 && total.value <= props.walletUsdt + 1e-9,
)

const formHint = computed(() => {
  if (!product.value) return ''
  if (!agreed.value) return '请勾选协议后继续'
  if (total.value <= 0) return '购买数量无效'
  if (total.value > props.walletUsdt + 1e-9) return 'USDT 余额不足'
  return ''
})

function incQty() {
  qty.value = Math.min(99, Math.max(1, Math.floor(qty.value)) + 1)
}

function decQty() {
  qty.value = Math.max(1, Math.floor(qty.value) - 1)
}

function goToConfirm() {
  if (!product.value) return
  if (!auth.isAuthenticated) {
    app.pushToast('warning', '请先登录后再购买算力')
    return
  }
  if (!canGoConfirm.value) {
    if (formHint.value) app.pushToast('warning', formHint.value)
    return
  }
  orderRefDemo.value = `MN-ORD-${Date.now().toString(36).toUpperCase()}`
  phase.value = 'confirm'
}

function backToForm() {
  phase.value = 'form'
}

function submitPurchase() {
  if (!product.value || phase.value !== 'confirm') return
  if (!auth.isAuthenticated) {
    app.pushToast('warning', '请先登录后再购买算力')
    return
  }
  const q = Math.max(1, Math.floor(qty.value))
  const ok = store.purchase(product.value.id, q)
  if (!ok) return
  successAnimKey.value += 1
  app.pushToast(
    'success',
    `算力订单已提交 · ${product.value.name} × ${q} · ${formatPrice(total.value)} USDT（演示）`,
  )
  phase.value = 'success'
}

const successDesc = computed(() => {
  const p = product.value
  if (!p) return ''
  const q = Math.max(1, Math.floor(qty.value))
  return `演示单号 ${orderRefDemo.value || '—'}。已支付 ${formatPrice(total.value)} USDT，开通 ${p.name} × ${q}，合计算力 ${formatPrice(totalHashrate.value)} TH/s，日估产出约 ${formatPrice(estDailyOut.value)} USDT/天。可在「进行中」查看订单。`
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue && product"
      class="mpm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="购买算力"
      @click.self="onOverlayClick"
    >
      <div class="mpm">
        <div class="mpm__head">
          <span class="mpm__title">{{ modalTitle }}</span>
          <button type="button" class="mpm__x" aria-label="关闭" @click="close">×</button>
        </div>

        <template v-if="phase === 'form'">
          <div class="mpm__body">
            <div class="mpm__grid">
              <span>挖矿币种</span>
              <span class="mpm__mono">{{ product.coin }}</span>
              <span>额定算力（单台）</span>
              <span class="mpm__mono">{{ product.hashrateTh }} TH/s</span>
              <span>租赁周期</span>
              <span class="mpm__mono">{{ product.durationDays }} 天</span>
              <span>单价</span>
              <span class="mpm__mono">{{ formatPrice(product.priceUsdt) }} USDT</span>
              <span>参考日收益率</span>
              <span class="mpm__mono mpm__mono--pnl"
                >{{ dailyYieldPct >= 0.01 ? dailyYieldPct.toFixed(3) : dailyYieldPct.toFixed(4) }}% / 日</span
              >
              <span>日估产出（本单）</span>
              <span class="mpm__mono mpm__mono--pnl">≈ {{ formatPrice(estDailyOut) }} USDT/天</span>
            </div>
            <label class="mpm__field">
              <span class="mpm__lab">购买台数</span>
              <div class="mpm__step">
                <button type="button" class="mpm__sbtn" :disabled="qty <= 1" @click="decQty">−</button>
                <input v-model.number="qty" type="number" min="1" max="99" class="mpm__num" @change="qty = Math.min(99, Math.max(1, Math.floor(qty) || 1))" />
                <button type="button" class="mpm__sbtn" :disabled="qty >= 99" @click="incQty">+</button>
              </div>
            </label>
            <p class="mpm__pay">
              应付：<span class="mpm__strong ex-num">{{ formatPrice(total) }}</span> USDT
            </p>
            <p class="mpm__wallet">钱包可用：<span class="ex-num">{{ formatPrice(walletUsdt) }}</span> USDT</p>
            <p class="mpm__hint">
              演示：预估周期总产出约 <span class="ex-num">{{ formatPrice(estTotalOut) }}</span> USDT（非承诺收益，以实际挖矿与难度为准）。
            </p>
            <label class="mpm__check">
              <input v-model="agreed" type="checkbox" class="mpm__cb" />
              <span>我已阅读《算力服务协议》与《矿池风险披露》，知晓算力产品存在币价、难度、停机等风险。</span>
            </label>
            <p v-if="formHint" class="mpm__form-hint">{{ formHint }}</p>
          </div>
          <div class="mpm__foot">
            <button type="button" class="mpm__btn mpm__btn--ghost" @click="close">取消</button>
            <button
              type="button"
              class="mpm__btn mpm__btn--primary"
              :disabled="!canGoConfirm"
              :title="formHint || undefined"
              @click="goToConfirm"
            >
              核对订单
            </button>
          </div>
        </template>

        <template v-else-if="phase === 'confirm'">
          <div class="mpm__body mpm__body--tight">
            <p class="mpm__confirm-lead">请核对订单信息；确认后将扣减矿机钱包余额并生成挖矿中订单（演示）。</p>
            <dl class="mpm__dl">
              <div class="mpm__dl-row">
                <dt>订单类型</dt>
                <dd>智能矿机算力租赁（演示）</dd>
              </div>
              <div class="mpm__dl-row">
                <dt>套餐名称</dt>
                <dd>{{ product.name }}</dd>
              </div>
              <div class="mpm__dl-row">
                <dt>挖矿币种</dt>
                <dd>{{ product.coin }}</dd>
              </div>
              <div class="mpm__dl-row">
                <dt>购买台数</dt>
                <dd><span class="ex-num">{{ Math.max(1, Math.floor(qty)) }}</span> 台</dd>
              </div>
              <div class="mpm__dl-row">
                <dt>合计算力</dt>
                <dd><span class="ex-num">{{ formatPrice(totalHashrate) }}</span> TH/s</dd>
              </div>
              <div class="mpm__dl-row">
                <dt>租赁周期</dt>
                <dd>{{ product.durationDays }} 天 / 台</dd>
              </div>
              <div class="mpm__dl-row mpm__dl-row--emph">
                <dt>应付合计</dt>
                <dd><span class="ex-num">{{ formatPrice(total) }}</span> USDT</dd>
              </div>
              <div class="mpm__dl-row">
                <dt>日估产出（参考）</dt>
                <dd><span class="ex-num">{{ formatPrice(estDailyOut) }}</span> USDT/天</dd>
              </div>
              <div class="mpm__dl-row">
                <dt>参考日收益率</dt>
                <dd>{{ dailyYieldPct >= 0.01 ? dailyYieldPct.toFixed(3) : dailyYieldPct.toFixed(4) }}% / 日</dd>
              </div>
              <div class="mpm__dl-row">
                <dt>演示单号</dt>
                <dd class="mpm__dl-mono">{{ orderRefDemo }}</dd>
              </div>
              <div class="mpm__dl-row">
                <dt>支付后钱包余额（演示）</dt>
                <dd><span class="ex-num">{{ formatPrice(walletAfter) }}</span> USDT</dd>
              </div>
            </dl>
            <p class="mpm__confirm-warn">正式环境以支付确认与算力开通结果为准；本页为前端演示。</p>
          </div>
          <div class="mpm__foot">
            <button type="button" class="mpm__btn mpm__btn--ghost" @click="backToForm">返回修改</button>
            <button type="button" class="mpm__btn mpm__btn--primary" @click="submitPurchase">确认支付</button>
          </div>
        </template>

        <template v-else>
          <div class="mpm__body mpm__body--success">
            <MinerOrderSuccessPanel
              :key="successAnimKey"
              ribbon="下单成功"
              title="算力订单已开通"
              :description="successDesc"
            />
          </div>
          <div class="mpm__foot mpm__foot--stack">
            <button type="button" class="mpm__btn mpm__btn--primary mpm__btn--block" @click="close">完成</button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.mpm-overlay {
  position: fixed;
  inset: 0;
  z-index: 520;
  background: var(--ex-overlay-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $space-4;
}

.mpm {
  width: 100%;
  max-width: 440px;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-modal-surface);
  box-shadow: var(--ex-modal-shadow-elevated);
}

.mpm__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-border;
}

.mpm__title {
  font-weight: $font-weight-bold;
  font-size: $font-size-md;
  color: $color-text-primary;
}

.mpm__x {
  border: none;
  background: transparent;
  color: $color-text-tertiary;
  font-size: 22px;
  cursor: pointer;
}

.mpm__body {
  padding: $space-4;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.mpm__body--tight {
  padding-top: $space-3;
  gap: $space-2;
}

.mpm__body--success {
  padding-bottom: $space-3;
}

.mpm__confirm-lead {
  margin: 0 0 $space-1;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.55;
}

.mpm__dl {
  margin: 0;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid var(--ex-border-subtle);
  background: var(--ex-surface-inset);
}

.mpm__dl-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: $space-3;
  padding: 8px 0;
  border-bottom: 1px solid var(--ex-border-subtle);
  font-size: $font-size-xs;

  &:last-child {
    border-bottom: none;
  }

  dt {
    margin: 0;
    color: $color-text-tertiary;
    flex-shrink: 0;
  }

  dd {
    margin: 0;
    text-align: right;
    color: $color-text-primary;
    font-weight: $font-weight-semibold;
  }
}

.mpm__dl-row--emph dd {
  color: $color-brand;
  font-size: $font-size-sm;
}

.mpm__dl-mono {
  font-family: $font-family-mono;
  font-size: 10px;
  word-break: break-all;
}

.mpm__confirm-warn {
  margin: 0;
  font-size: 10px;
  line-height: 1.5;
  color: $color-text-tertiary;
}

.mpm__form-hint {
  margin: 0;
  font-size: 11px;
  color: $color-text-tertiary;
}

.mpm__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $space-2;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.mpm__mono {
  color: $color-text-primary;
  font-family: $font-family-mono;
  text-align: right;
}

.mpm__mono--pnl {
  color: $color-rise;
  font-weight: $font-weight-semibold;
}

.mpm__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mpm__lab {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.mpm__step {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.mpm__sbtn {
  width: 36px;
  height: 36px;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-surface-inset-strong);
  color: $color-text-primary;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.mpm__sbtn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.mpm__num {
  flex: 1;
  text-align: center;
  padding: 8px;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-surface-inset-strong);
  color: $color-text-primary;
  font-family: $font-family-mono;
}

.mpm__pay,
.mpm__wallet,
.mpm__hint {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.5;
}

.mpm__strong {
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-brand;
}

.mpm__check {
  display: flex;
  gap: $space-2;
  font-size: 11px;
  line-height: 1.45;
  color: $color-text-tertiary;
  cursor: pointer;
  align-items: flex-start;
}

.mpm__cb {
  margin-top: 2px;
  accent-color: #3084fc;
  flex-shrink: 0;
}

.mpm__foot {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
  padding: $space-3 $space-4;
  border-top: 1px solid $color-border;
}

.mpm__foot--stack {
  flex-direction: column;
}

.mpm__btn {
  padding: $space-2 $space-4;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  cursor: pointer;
  border: 1px solid transparent;
}

.mpm__btn--ghost {
  background: transparent;
  border-color: $color-border;
  color: $color-text-secondary;
}

.mpm__btn--primary {
  background: linear-gradient(180deg, #4a8efc 0%, #3084fc 100%);
  color: #fff;
}

.mpm__btn--primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.mpm__btn--block {
  width: 100%;
}

.ex-num {
  font-family: $font-family-mono;
}
</style>
