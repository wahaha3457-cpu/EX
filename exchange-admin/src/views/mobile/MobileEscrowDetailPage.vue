<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useMobileDemoStore } from '@/stores/mobileDemo'
import { useMobileUiStore } from '@/stores/mobileUiStore'
import MpBackBar from '@/components/mobile/MpBackBar.vue'

const route = useRoute()
const router = useRouter()
const demo = useMobileDemoStore()
const ui = useMobileUiStore()
const { escrows } = storeToRefs(demo)

const e = computed(() => escrows.value.find((x) => x.id === route.params.id as string))

const map: Record<string, string> = {
  holding: '托管中',
  delivered: '待确认收货',
  pending_release: '待放款',
  completed: '已完成',
  cancelled: '已取消',
}

async function deliver() {
  if (!e.value) return
  if (await ui.openConfirm({ title: '提交交付', message: '标记为已交付？', confirmText: '确定' }))
    demo.escrowSubmitDelivery(e.value.id)
}

async function recv() {
  if (!e.value) return
  if (await ui.openConfirm({ title: '确认收货', message: '确认对方已履约？', confirmText: '确定' }))
    demo.escrowConfirmReceive(e.value.id)
}

async function release() {
  if (!e.value) return
  if (await ui.openConfirm({ title: '确认放款', message: '释放托管资金（演示退回可用）？', confirmText: '放款' }))
    demo.escrowRelease(e.value.id)
}

async function cancelHolding() {
  if (!e.value) return
  if (
    await ui.openConfirm({
      title: '取消托管',
      message: '将解除锁定并把 USDT 退回可用余额（演示）。',
      confirmText: '确认取消',
      dangerous: true,
    })
  )
    demo.escrowCancelHolding(e.value.id)
}
</script>

<template>
  <div class="page">
    <MpBackBar title="托管详情" />
    <template v-if="e">
      <div class="card">
        <p class="st">{{ map[e.status] ?? e.status }}</p>
        <h2>{{ e.title }}</h2>
        <p>金额 <b>{{ e.amountUsdt }} USDT</b></p>
        <p>对手 {{ e.counterparty }}</p>
        <p>方式 {{ e.deliveryMethod }}</p>
        <p class="des">{{ e.description }}</p>
      </div>
      <button v-if="e.status === 'holding'" type="button" class="btn" @click="deliver">提交交付</button>
      <button v-if="e.status === 'holding'" type="button" class="btn ghost" @click="cancelHolding">
        取消托管
      </button>
      <button v-if="e.status === 'delivered'" type="button" class="btn" @click="recv">确认收货</button>
      <button v-if="e.status === 'pending_release'" type="button" class="btn primary" @click="release">
        确认放款
      </button>
      <button type="button" class="link" @click="router.push({ name: RouteNames.MobileMeEscrows })">
        我的托管列表 →
      </button>
    </template>
    <p v-else class="err">记录不存在</p>
  </div>
</template>

<style scoped lang="scss">
.page {
  padding: 8px 18px 24px;
}

.card {
  padding: 20px;
  border-radius: 22px;
  background: rgba(22, 28, 38, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 16px;

  .st {
    color: #4dc4ff;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 10px;
  }

  h2 {
    font-size: 18px;
    margin-bottom: 10px;
  }

  p {
    font-size: 14px;
    color: #8b95a8;
    margin-bottom: 6px;

    b {
      color: #2ee6c8;
    }
  }

  .des {
    margin-top: 10px;
    line-height: 1.45;
  }
}

.btn {
  width: 100%;
  padding: 14px;
  margin-bottom: 10px;
  border-radius: 12px;
  border: 1px solid rgba(77, 196, 255, 0.35);
  background: rgba(77, 196, 255, 0.12);
  color: #4dc4ff;
  font-weight: 700;
  cursor: pointer;

  &.primary {
    background: linear-gradient(180deg, #3ee6c4 0%, #1fb89a 100%);
    color: #061210;
    border: none;
  }

  &.ghost {
    background: transparent;
    color: #e89898;
    border-color: rgba(232, 152, 152, 0.35);
  }
}

.link {
  width: 100%;
  margin-top: 12px;
  border: none;
  background: none;
  color: #4dc4ff;
  font-weight: 600;
  cursor: pointer;
}

.err {
  text-align: center;
  padding: 40px;
  color: #e89898;
}
</style>
