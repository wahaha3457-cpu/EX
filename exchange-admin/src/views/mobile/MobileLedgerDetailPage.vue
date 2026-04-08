<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useMobileDemoStore } from '@/stores/mobileDemo'
import { useMobileUiStore } from '@/stores/mobileUiStore'
import type { LedgerKind } from '@/types/mobileDemo'
import MpBackBar from '@/components/mobile/MpBackBar.vue'

const route = useRoute()
const router = useRouter()
const demo = useMobileDemoStore()
const ui = useMobileUiStore()
const { ledger, tasks, otcOrders, escrows } = storeToRefs(demo)

const row = computed(() => ledger.value.find((x) => x.id === route.params.id as string))

const kindLabel: Record<LedgerKind, string> = {
  task_in: '任务',
  task_out: '任务',
  escrow_lock: '担保托管',
  escrow_release: '担保托管',
  otc_buy: 'OTC',
  otc_sell: 'OTC',
  withdraw: '提现',
  deposit: '充值',
  fee: '手续费',
}

const relatedTarget = computed(() => {
  const r = row.value
  if (!r?.relatedId) return null
  if (r.kind === 'otc_buy' || r.kind === 'otc_sell') {
    if (otcOrders.value.some((o) => o.id === r.relatedId)) {
      return { name: RouteNames.MobileOtcOrder, params: { id: r.relatedId }, label: '查看订单' }
    }
  }
  if (r.kind === 'task_in' || r.kind === 'task_out') {
    if (tasks.value.some((t) => t.id === r.relatedId)) {
      return { name: RouteNames.MobileTaskDetail, params: { id: r.relatedId }, label: '查看任务' }
    }
  }
  if (r.kind === 'escrow_lock' || r.kind === 'escrow_release') {
    if (escrows.value.some((e) => e.id === r.relatedId)) {
      return { name: RouteNames.MobileEscrowDetail, params: { id: r.relatedId }, label: '查看托管' }
    }
  }
  return null
})

function goAssets() {
  router.push({ name: RouteNames.MobileAssets })
}

async function simulateWithdrawDone() {
  if (!row.value) return
  const ok = await ui.openConfirm({
    title: '模拟提现完成',
    message: '将本条提现流水标为「已完成」（演示审核/链上通过）。',
    confirmText: '标记完成',
  })
  if (ok) demo.simulateWithdrawLedgerComplete(row.value.id)
}
</script>

<template>
  <div class="page">
    <MpBackBar title="流水详情" />
    <div v-if="row" class="card">
      <p class="tag">{{ kindLabel[row.kind] ?? row.kind }}</p>
      <h2>{{ row.title }}</h2>
      <p>
        金额变动
        <b>{{ row.amountUsdt >= 0 ? '+' : '' }}{{ row.amountUsdt }}</b> USDT
      </p>
      <p>状态 {{ row.status }}</p>
      <p>时间 {{ new Date(row.at).toLocaleString('zh-CN') }}</p>
      <p v-if="row.relatedId" class="mono">关联单号 {{ row.relatedId }}</p>

      <button
        v-if="relatedTarget"
        type="button"
        class="cta"
        @click="router.push({ name: relatedTarget.name, params: relatedTarget.params })"
      >
        {{ relatedTarget.label }} →
      </button>
      <button
        v-if="row.kind === 'withdraw' && row.status === '处理中'"
        type="button"
        class="cta"
        @click="simulateWithdrawDone"
      >
        模拟提现完成（演示）
      </button>
      <button
        v-if="row.kind === 'withdraw' || row.kind === 'deposit'"
        type="button"
        class="cta secondary"
        @click="goAssets"
      >
        返回资产总览 →
      </button>
    </div>
    <p v-else class="err">记录不存在</p>
  </div>
</template>

<style scoped lang="scss">
.page {
  padding: 8px 18px 24px;
}

.card {
  padding: 22px;
  border-radius: 22px;
  background: rgba(22, 28, 38, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.08);

  .tag {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 8px;
    background: rgba(77, 196, 255, 0.12);
    color: #4dc4ff;
    margin-bottom: 12px;
  }

  h2 {
    font-size: 18px;
    margin-bottom: 14px;
    line-height: 1.4;
  }

  p {
    font-size: 14px;
    color: #8b95a8;
    margin-bottom: 8px;

    b {
      color: #2ee6c8;
      font-variant-numeric: tabular-nums;
    }
  }

  .mono {
    font-size: 11px;
    word-break: break-all;
    opacity: 0.8;
  }
}

.cta {
  width: 100%;
  margin-top: 12px;
  padding: 14px;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(180deg, #3ee6c4 0%, #1fb89a 100%);
  color: #061210;

  &:first-of-type {
    margin-top: 20px;
  }

  &.secondary {
    background: rgba(77, 196, 255, 0.12);
    color: #4dc4ff;
    border: 1px solid rgba(77, 196, 255, 0.28);
  }
}

.err {
  text-align: center;
  padding: 40px;
  color: #e89898;
}
</style>
