<script setup lang="ts">
/**
 * 申诉进度 + 在线客服衔接 + 演示裁定（闭环）
 */
import { onMounted, ref, watch } from 'vue'
import type { C2cAppealRecord } from '@/types/c2c'
import { ensureLegacyAppealStub, fetchC2cAppeal } from '@/api/c2c/c2cMock'
import { useAuthStore } from '@/stores/auth'
import { useC2cMarketStore } from '@/stores/c2cMarket'
import { useSupportChatUiStore } from '@/stores/supportChatUi'

const props = defineProps<{
  orderId: string
}>()

const emit = defineEmits<{
  (e: 'updated'): void
}>()

const auth = useAuthStore()
const store = useC2cMarketStore()
const chatUi = useSupportChatUiStore()

const appeal = ref<C2cAppealRecord | null>(null)
const loading = ref(false)

const stageLabel: Record<C2cAppealRecord['stage'], string> = {
  submitted: '已提交',
  cs_processing: '客服处理中',
  resolved: '已结案',
  withdrawn: '已撤诉',
}

async function load() {
  const uid = auth.user?.userCode
  if (!uid) return
  loading.value = true
  try {
    await ensureLegacyAppealStub(uid, props.orderId)
    appeal.value = await fetchC2cAppeal(props.orderId)
  } finally {
    loading.value = false
  }
}

function openSupport() {
  const a = appeal.value
  const ticket = a?.ticketId ?? '—'
  const draft = `【C2C 申诉】工单 ${ticket} · 订单 ${props.orderId}\n您好，我需要协助处理该笔 P2P 订单，补充说明如下：\n`
  chatUi.openWithDraft(draft)
}

async function onWithdraw() {
  const ok = await store.withdrawAppeal(props.orderId)
  if (ok) emit('updated')
}

async function onDemoResolve(outcome: 'release' | 'cancel') {
  await store.appealResolveDemo(props.orderId, outcome)
  emit('updated')
}

onMounted(() => {
  void load().then(() => {
    window.setTimeout(() => void load(), 1000)
  })
})

watch(
  () => props.orderId,
  () => {
    void load()
  },
)

function fmtTime(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' })
}

function kindLabel(k: string) {
  if (k === 'user') return '我'
  if (k === 'cs') return '客服'
  return '系统'
}
</script>

<template>
  <section class="c2c-apw" aria-label="申诉进度">
    <div class="c2c-apw__head">
      <h3 class="c2c-apw__title">申诉进度</h3>
      <span v-if="appeal" class="c2c-apw__badge" :data-st="appeal.stage">{{ stageLabel[appeal.stage] }}</span>
    </div>

    <p v-if="loading" class="c2c-apw__muted">加载工单…</p>
    <template v-else-if="appeal">
      <p class="c2c-apw__ticket">
        工单号 <strong class="ex-num">{{ appeal.ticketId }}</strong>
      </p>

      <ol class="c2c-apw__tl">
        <!-- 时间正序：先用户提交，后客服跟进，避免流程展示颠倒 -->
        <li v-for="ev in appeal.timeline" :key="ev.id" class="c2c-apw__tl-i">
          <div class="c2c-apw__tl-meta">
            <span class="c2c-apw__tl-who">{{ kindLabel(ev.kind) }}</span>
            <time :datetime="ev.at" class="c2c-apw__tl-time">{{ fmtTime(ev.at) }}</time>
          </div>
          <p class="c2c-apw__tl-title">{{ ev.title }}</p>
          <p v-if="ev.detail" class="c2c-apw__tl-detail">{{ ev.detail }}</p>
        </li>
      </ol>

      <div class="c2c-apw__actions">
        <button type="button" class="c2c-apw__btn c2c-apw__btn--pri" @click="openSupport">联系在线客服</button>
        <button
          v-if="appeal.stage !== 'resolved' && appeal.stage !== 'withdrawn'"
          type="button"
          class="c2c-apw__btn"
          @click="onWithdraw"
        >
          撤诉（回到待放币）
        </button>
      </div>

      <div v-if="appeal.stage === 'cs_processing' || appeal.stage === 'submitted'" class="c2c-apw__demo">
        <p class="c2c-apw__demo-h">演示 · 客服裁定</p>
        <div class="c2c-apw__demo-row">
          <button type="button" class="c2c-apw__dbtn" @click="onDemoResolve('release')">裁定：放行放币（成交）</button>
          <button type="button" class="c2c-apw__dbtn" @click="onDemoResolve('cancel')">裁定：取消订单</button>
        </div>
      </div>
    </template>
    <p v-else class="c2c-apw__muted">暂无申诉工单数据</p>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/abstracts/variables' as *;

.c2c-apw {
  margin-top: $space-3;
  padding: $space-3;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  background: var(--ex-panel-sunken);
}

.c2c-apw__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  margin-bottom: $space-2;
}

.c2c-apw__title {
  margin: 0;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.c2c-apw__badge {
  font-size: 10px;
  font-weight: $font-weight-bold;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--ex-fill-hover-subtle);
  color: $color-text-secondary;

  &[data-st='submitted'] {
    background: rgba(240, 185, 11, 0.15);
    color: $color-brand;
  }

  &[data-st='cs_processing'] {
    background: rgba(48, 132, 252, 0.12);
    color: #5b8cff;
  }

  &[data-st='resolved'] {
    background: rgba(14, 203, 129, 0.12);
    color: $color-rise;
  }
}

.c2c-apw__ticket {
  margin: 0 0 $space-3;
  font-size: $font-size-xs;
  color: $color-text-secondary;
}

.c2c-apw__tl {
  list-style: none;
  margin: 0 0 $space-3;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $space-3;
  max-height: 200px;
  overflow-y: auto;
}

.c2c-apw__tl-i {
  padding-left: $space-3;
  border-left: 2px solid rgba(240, 185, 11, 0.35);
}

.c2c-apw__tl-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: $space-2;
  margin-bottom: 4px;
}

.c2c-apw__tl-who {
  font-size: 10px;
  font-weight: $font-weight-bold;
  color: $color-brand;
}

.c2c-apw__tl-time {
  font-size: 10px;
  color: $color-text-tertiary;
  font-variant-numeric: tabular-nums;
}

.c2c-apw__tl-title {
  margin: 0;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
}

.c2c-apw__tl-detail {
  margin: 4px 0 0;
  font-size: 11px;
  color: $color-text-secondary;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

.c2c-apw__actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.c2c-apw__btn {
  padding: 8px 12px;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  border-radius: $radius-sm;
  border: 1px solid $color-border;
  background: transparent;
  color: $color-text-primary;
  cursor: pointer;

  &:hover {
    background: var(--ex-fill-hover-subtle);
  }
}

.c2c-apw__btn--pri {
  background: rgba(240, 185, 11, 0.14);
  border-color: rgba(240, 185, 11, 0.35);
  color: $color-brand;
}

.c2c-apw__demo {
  margin-top: $space-3;
  padding-top: $space-3;
  border-top: 1px dashed $color-border;
}

.c2c-apw__demo-h {
  margin: 0 0 $space-2;
  font-size: 10px;
  font-weight: $font-weight-bold;
  color: $color-text-tertiary;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.c2c-apw__demo-row {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.c2c-apw__dbtn {
  padding: 6px 10px;
  font-size: 10px;
  font-weight: $font-weight-semibold;
  border-radius: $radius-sm;
  border: 1px solid var(--ex-border-subtle);
  background: var(--ex-fill-ghost);
  color: $color-text-secondary;
  cursor: pointer;

  &:hover {
    border-color: rgba(240, 185, 11, 0.35);
    color: $color-text-primary;
  }
}

.c2c-apw__muted {
  margin: 0;
  font-size: $font-size-xs;
  color: $color-text-tertiary;
}
</style>
