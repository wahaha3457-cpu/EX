<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useCharityHubStore } from '@/stores/charityHub'
import type { CharityCampaign } from '@/types/charity'
import { charityCoverUrl } from '@/api/charity/charityMock'
import { formatPrice } from '@/utils/format'
import CharityDonationSuccessHearts from '@/components/business/charity/CharityDonationSuccessHearts.vue'

const props = defineProps<{
  modelValue: boolean
  meta: CharityCampaign | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const { t } = useI18n()
const auth = useAuthStore()
const app = useAppStore()
const store = useCharityHubStore()

/** 捐赠流程：表单 → 订单核对 → 成功动画 */
const donationPhase = ref<'form' | 'confirm' | 'success'>('form')
const agreed = ref(false)
const orderRefDemo = ref('')
const successAnimKey = ref(0)
const amount = ref<number>(20)

const PRESETS = [20, 50, 100] as const

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

watch(
  () => props.meta?.slug,
  () => {
    amount.value = 20
    donationPhase.value = 'form'
    agreed.value = false
    orderRefDemo.value = ''
  },
)

watch(visible, (v) => {
  if (!v) {
    donationPhase.value = 'form'
    agreed.value = false
    orderRefDemo.value = ''
  }
})

const title = computed(() => (props.meta ? t(`charity.items.${props.meta.slug}.title`) : ''))
const summary = computed(() => (props.meta ? t(`charity.items.${props.meta.slug}.summary`) : ''))

const paragraphs = computed(() => {
  if (!props.meta) return []
  const raw = t(`charity.items.${props.meta.slug}.body`) as string
  return raw.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
})

const cover = computed(() => (props.meta ? charityCoverUrl(props.meta.coverSeed, 800, 420) : ''))

const pct = computed(() => {
  const m = props.meta
  if (!m || m.goalUsdt <= 0) return 0
  return Math.min(100, Math.round((m.raisedUsdt / m.goalUsdt) * 1000) / 10)
})

const drawerTitle = computed(() => {
  if (!props.meta) return ''
  if (donationPhase.value === 'success') return t('charity.flow.drawerTitleSuccess')
  if (donationPhase.value === 'confirm') return t('charity.flow.drawerTitleConfirm')
  return title.value
})

const amountNum = computed(() => {
  const n = Number(amount.value)
  return Number.isFinite(n) ? n : 0
})

/** 提交前「预计已筹」，用于核对页展示 */
const raisedAfterPreview = computed(() => {
  if (!props.meta) return 0
  return props.meta.raisedUsdt + amountNum.value
})

const canGoConfirm = computed(() => {
  if (!props.meta || props.meta.status !== 'ACTIVE') return false
  if (!agreed.value) return false
  return amountNum.value > 0
})

const formHint = computed(() => {
  if (!props.meta || props.meta.status !== 'ACTIVE') return ''
  if (!agreed.value) return t('charity.flow.needAgree')
  if (amountNum.value <= 0) return t('charity.amountInvalid')
  return ''
})

const successDescription = computed(() =>
  t('charity.flow.successDesc', {
    id: orderRefDemo.value || '—',
    amount: formatPrice(amountNum.value),
    title: title.value,
  }),
)

function regionLabel(key: string) {
  return t(`charity.region.${key}`)
}

function catLabel(c: string) {
  return t(`charity.cat.${c}`)
}

function fmtEnd(iso: string | null) {
  if (!iso) return t('charity.status.completed')
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

function setPreset(n: number) {
  amount.value = n
}

function goToConfirm() {
  if (!props.meta) return
  if (!auth.isAuthenticated) {
    app.pushToast('warning', t('charity.needLogin'))
    return
  }
  if (amountNum.value <= 0) {
    app.pushToast('error', t('charity.amountInvalid'))
    return
  }
  if (!agreed.value) {
    app.pushToast('warning', t('charity.flow.needAgree'))
    return
  }
  orderRefDemo.value = `CH-DN-${Date.now().toString(36).toUpperCase()}`
  donationPhase.value = 'confirm'
}

function backToForm() {
  donationPhase.value = 'form'
}

function submitDonation() {
  if (!props.meta || donationPhase.value !== 'confirm') return
  if (!auth.isAuthenticated) {
    app.pushToast('warning', t('charity.needLogin'))
    return
  }
  const ok = store.mockDonate(props.meta.slug, amountNum.value, orderRefDemo.value)
  if (!ok) return
  successAnimKey.value += 1
  app.pushToast('success', t('charity.flow.toastOk'))
  donationPhase.value = 'success'
}

function finishAndClose() {
  visible.value = false
}

function donateAgain() {
  donationPhase.value = 'form'
  agreed.value = false
  orderRefDemo.value = ''
}
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="drawerTitle"
    direction="rtl"
    size="min(100%, 480px)"
    destroy-on-close
    append-to-body
    class="ch-drawer"
  >
    <template v-if="meta">
      <!-- —— 成功态：爱心动画 + 操作 —— -->
      <div v-if="donationPhase === 'success'" class="ch-d ch-d--success">
        <CharityDonationSuccessHearts
          :key="successAnimKey"
          :ribbon="t('charity.flow.successRibbon')"
          :title="t('charity.flow.successTitle')"
          :description="successDescription"
        />
        <div class="ch-d__success-actions">
          <button type="button" class="ch-d__btn ch-d__btn--ghost" @click="donateAgain">{{ t('charity.flow.again') }}</button>
          <button type="button" class="ch-d__btn" @click="finishAndClose">{{ t('charity.flow.done') }}</button>
        </div>
      </div>

      <!-- —— 核对订单 —— -->
      <div v-else-if="donationPhase === 'confirm'" class="ch-d">
        <div class="ch-d__cover ch-d__cover--compact">
          <img :src="cover" :alt="title" />
        </div>
        <div class="ch-d__badges">
          <span class="ch-d__pill">{{ catLabel(meta.category) }}</span>
          <span class="ch-d__pill ch-d__pill--muted">{{ regionLabel(meta.regionKey) }}</span>
        </div>
        <h2 class="ch-d__h2">{{ title }}</h2>
        <p class="ch-d__confirm-lead">{{ t('charity.flow.confirmLead') }}</p>
        <dl class="ch-d__dl">
          <div class="ch-d__dl-row">
            <dt>{{ t('charity.flow.orderType') }}</dt>
            <dd>{{ t('charity.flow.orderTypeVal') }}</dd>
          </div>
          <div class="ch-d__dl-row">
            <dt>{{ t('charity.flow.project') }}</dt>
            <dd>{{ title }}</dd>
          </div>
          <div class="ch-d__dl-row">
            <dt>{{ t('charity.flow.region') }}</dt>
            <dd>{{ regionLabel(meta.regionKey) }}</dd>
          </div>
          <div class="ch-d__dl-row ch-d__dl-row--emph">
            <dt>{{ t('charity.flow.amount') }}</dt>
            <dd><span class="ex-num">{{ formatPrice(amountNum) }}</span> USDT</dd>
          </div>
          <div class="ch-d__dl-row">
            <dt>{{ t('charity.flow.asset') }}</dt>
            <dd>{{ t('charity.flow.assetVal') }}</dd>
          </div>
          <div class="ch-d__dl-row">
            <dt>{{ t('charity.flow.orderNo') }}</dt>
            <dd class="ch-d__mono">{{ orderRefDemo || '—' }}</dd>
          </div>
          <div class="ch-d__dl-row">
            <dt>{{ t('charity.flow.afterRaised') }}</dt>
            <dd><span class="ex-num">{{ formatPrice(raisedAfterPreview) }}</span> / {{ formatPrice(meta.goalUsdt) }} USDT</dd>
          </div>
        </dl>
        <p class="ch-d__confirm-warn">{{ t('charity.flow.confirmWarn') }}</p>
        <div class="ch-d__flow-actions">
          <button type="button" class="ch-d__btn ch-d__btn--ghost" @click="backToForm">{{ t('charity.flow.back') }}</button>
          <button type="button" class="ch-d__btn" @click="submitDonation">{{ t('charity.flow.submit') }}</button>
        </div>
      </div>

      <!-- —— 详情 + 捐赠表单 —— -->
      <div v-else class="ch-d">
        <div class="ch-d__cover">
          <img :src="cover" :alt="title" />
        </div>
        <div class="ch-d__badges">
          <span class="ch-d__pill">{{ catLabel(meta.category) }}</span>
          <span class="ch-d__pill ch-d__pill--muted">{{ regionLabel(meta.regionKey) }}</span>
          <span
            class="ch-d__pill"
            :class="meta.status === 'ACTIVE' ? 'ch-d__pill--ok' : 'ch-d__pill--done'"
            >{{ meta.status === 'ACTIVE' ? t('charity.badge.active') : t('charity.badge.completed') }}</span
          >
        </div>

        <p class="ch-d__sum">{{ summary }}</p>

        <div class="ch-d__prog">
          <div class="ch-d__prog-head">
            <span>{{ t('charity.raised') }} {{ formatPrice(meta.raisedUsdt) }} USDT</span>
            <span class="ch-d__goal">{{ t('charity.goal') }} {{ formatPrice(meta.goalUsdt) }} USDT</span>
          </div>
          <div class="ch-d__track" role="progressbar" :aria-valuenow="pct" aria-valuemin="0" aria-valuemax="100">
            <div class="ch-d__fill" :style="{ width: `${pct}%` }" />
          </div>
          <p class="ch-d__meta">{{ t('charity.donors', { n: meta.donors.toLocaleString() }) }} · {{ fmtEnd(meta.endAt) }}</p>
        </div>

        <div class="ch-d__body">
          <p v-for="(p, i) in paragraphs" :key="i" class="ch-d__p">{{ p }}</p>
        </div>

        <p class="ch-d__risk">{{ t('charity.detailRisk') }}</p>

        <div v-if="meta.status === 'ACTIVE'" class="ch-d__don">
          <label class="ch-d__lab">{{ t('charity.amountLabel') }}</label>
          <p class="ch-d__preset-hint">{{ t('charity.flow.presetHint') }}</p>
          <div class="ch-d__presets">
            <button v-for="p in PRESETS" :key="p" type="button" class="ch-d__preset" @click="setPreset(p)">{{ p }} USDT</button>
          </div>
          <div class="ch-d__don-row">
            <input v-model.number="amount" type="number" min="1" step="1" class="ch-d__input" />
            <span class="ch-d__unit">USDT</span>
          </div>
          <label class="ch-d__check">
            <input v-model="agreed" type="checkbox" class="ch-d__cb" />
            <span>{{ t('charity.flow.agree') }}</span>
          </label>
          <p v-if="formHint" class="ch-d__form-hint">{{ formHint }}</p>
          <button
            type="button"
            class="ch-d__btn"
            :disabled="!canGoConfirm"
            :title="formHint || undefined"
            @click="goToConfirm"
          >
            {{ t('charity.flow.review') }}
          </button>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.ch-d__cover {
  border-radius: $radius-md;
  overflow: hidden;
  border: 1px solid $color-border;
  margin-bottom: $space-3;
}

.ch-d__cover--compact {
  max-height: 160px;

  img {
    max-height: 160px;
    aspect-ratio: unset;
    object-position: center;
  }
}

.ch-d__cover img {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  display: block;
}

.ch-d__h2 {
  margin: 0 0 $space-2;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  line-height: 1.4;
}

.ch-d__confirm-lead {
  margin: 0 0 $space-3;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  line-height: 1.55;
}

.ch-d__dl {
  margin: 0 0 $space-3;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  border: 1px solid var(--ex-border-subtle);
  background: var(--ex-bg-muted);
}

.ch-d__dl-row {
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

.ch-d__dl-row--emph dd {
  color: $color-brand;
  font-size: $font-size-sm;
}

.ch-d__mono {
  font-family: $font-family-mono;
  font-size: 10px;
  word-break: break-all;
}

.ch-d__flow-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  margin-top: $space-2;
}

.ch-d__confirm-warn {
  margin: 0 0 $space-2;
  font-size: 10px;
  line-height: 1.5;
  color: $color-text-tertiary;
}

.ch-d--success {
  padding-bottom: $space-2;
}

.ch-d__success-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
  margin-top: $space-4;
}

.ch-d__success-actions .ch-d__btn {
  flex: 1;
  min-width: 120px;
}

.ch-d__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: $space-3;
}

.ch-d__pill {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 4px 10px;
  border-radius: $radius-sm;
  background: var(--ex-brand-muted);
  color: $color-brand;
  border: 1px solid color-mix(in srgb, var(--ex-brand) 25%, transparent);

  &--muted {
    background: var(--ex-bg-muted);
    color: $color-text-secondary;
    border-color: $color-border;
  }

  &--ok {
    color: $color-rise;
    background: var(--ex-rise-bg);
    border-color: color-mix(in srgb, var(--ex-rise) 28%, transparent);
  }

  &--done {
    color: $color-text-tertiary;
  }
}

.ch-d__sum {
  margin: 0 0 $space-4;
  font-size: $font-size-sm;
  line-height: 1.55;
  color: $color-text-secondary;
  font-weight: $font-weight-semibold;
}

.ch-d__prog {
  margin-bottom: $space-4;
  padding: $space-3;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-bg-muted);
}

.ch-d__prog-head {
  display: flex;
  justify-content: space-between;
  gap: $space-2;
  font-size: $font-size-xs;
  color: $color-text-primary;
  margin-bottom: $space-2;
}

.ch-d__goal {
  color: $color-text-tertiary;
}

.ch-d__track {
  height: 8px;
  border-radius: 4px;
  background: var(--ex-fill-ghost);
  overflow: hidden;
}

.ch-d__fill {
  height: 100%;
  border-radius: 4px;
  background: var(--ex-brand);
  transition: width 0.4s ease;
}

.ch-d__meta {
  margin: $space-2 0 0;
  font-size: 11px;
  color: $color-text-tertiary;
}

.ch-d__body {
  font-size: $font-size-sm;
  line-height: 1.65;
  color: $color-text-primary;
}

.ch-d__p + .ch-d__p {
  margin-top: $space-3;
}

.ch-d__risk {
  margin: $space-5 0 0;
  padding: $space-3;
  border-radius: $radius-sm;
  font-size: 11px;
  line-height: 1.5;
  color: $color-text-tertiary;
  background: var(--ex-bg-muted);
  border: 1px solid $color-border;
}

.ch-d__don {
  margin-top: $space-4;
  padding-top: $space-4;
  border-top: 1px solid $color-border;
}

.ch-d__lab {
  display: block;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  color: $color-text-tertiary;
  margin-bottom: 6px;
}

.ch-d__preset-hint {
  margin: 0 0 6px;
  font-size: 10px;
  color: $color-text-tertiary;
}

.ch-d__presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: $space-2;
}

.ch-d__preset {
  padding: 6px 12px;
  font-size: 11px;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  border: 1px solid rgba(240, 185, 11, 0.35);
  background: rgba(240, 185, 11, 0.08);
  color: $color-brand;
  cursor: pointer;
}

.ch-d__preset:hover {
  background: rgba(240, 185, 11, 0.14);
}

.ch-d__don-row {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-2;
}

.ch-d__input {
  flex: 1;
  max-width: 160px;
  padding: 10px 12px;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: var(--ex-bg-elevated);
  color: $color-text-primary;
  font-size: $font-size-sm;
}

.ch-d__unit {
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}

.ch-d__check {
  display: flex;
  gap: $space-2;
  font-size: 11px;
  line-height: 1.45;
  color: $color-text-secondary;
  cursor: pointer;
  align-items: flex-start;
  margin-bottom: $space-2;
}

.ch-d__cb {
  margin-top: 2px;
  accent-color: $color-brand;
  flex-shrink: 0;
}

.ch-d__form-hint {
  margin: 0 0 $space-2;
  font-size: 11px;
  color: $color-text-tertiary;
}

.ch-d__btn {
  width: 100%;
  max-width: 280px;
  padding: 12px;
  border: none;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  cursor: pointer;
  background: $color-brand;
  color: var(--ex-on-brand);
}

.ch-d__btn:hover:not(:disabled) {
  filter: brightness(1.05);
}

.ch-d__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ch-d__btn--ghost {
  background: transparent;
  border: 1px solid $color-border;
  color: $color-text-secondary;
  max-width: none;
}

.ch-d__btn--ghost:hover:not(:disabled) {
  filter: none;
  border-color: rgba(240, 185, 11, 0.35);
  color: $color-text-primary;
}

.ex-num {
  font-family: $font-family-mono;
}
</style>

<style lang="scss">
.ch-drawer.el-drawer {
  --el-drawer-bg-color: var(--ex-card-surface);
}
</style>
