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
const { otcOrders } = storeToRefs(demo)

const order = computed(() => otcOrders.value.find((x) => x.id === route.params.id as string))

const statusLabel: Record<string, string> = {
  pending_payment: '待支付',
  pending_confirm: '待放币/待确认',
  pending_release: '待放行',
  completed: '已完成',
  cancelled: '已取消',
}

async function onPaid() {
  if (!order.value) return
  const ok = await ui.openConfirm({
    title: '我已付款',
    message: '演示：标记为已付款，进入待放币状态。',
    confirmText: '确认',
  })
  if (ok) demo.otcMarkPaid(order.value.id)
}

async function onRelease() {
  if (!order.value) return
  const ok = await ui.openConfirm({
    title: '模拟放币',
    message: '演示：模拟商家已放币，USDT 将入账。',
    confirmText: '确认放币',
  })
  if (ok) demo.otcSimulateRelease(order.value.id)
}

async function onRecv() {
  if (!order.value) return
  const ok = await ui.openConfirm({
    title: '确认已收款',
    message: '演示：确认收到法币，完成卖单交割。',
    confirmText: '确认',
  })
  if (ok) demo.sellConfirmReceived(order.value.id)
}

async function onCancel() {
  if (!order.value) return
  const ok = await ui.openConfirm({
    title: '取消订单',
    message:
      order.value.side === 'sell'
        ? '取消后卖单将关闭，冻结的 USDT 退回可用余额（演示）。'
        : '取消后买单将关闭（演示）。',
    confirmText: '确认取消',
    dangerous: true,
  })
  if (ok) demo.otcCancelOrder(order.value.id)
}
</script>

<template>
  <div class="page">
    <MpBackBar title="订单详情" />
    <template v-if="order">
      <div class="card">
        <p class="st">{{ statusLabel[order.status] ?? order.status }}</p>
        <h2>{{ order.side === 'buy' ? '买入' : '卖出' }} · {{ order.merchantName }}</h2>
        <p>数量 <b>{{ order.amountUsdt }}</b> USDT</p>
        <p>法币参考 ¥ {{ order.totalCny }}</p>
        <p class="id">订单号 {{ order.id }}</p>
      </div>

      <template v-if="order.side === 'buy'">
        <button
          v-if="order.status === 'pending_payment'"
          type="button"
          class="btn"
          @click="onPaid"
        >
          我已付款
        </button>
        <button
          v-if="order.status === 'pending_confirm'"
          type="button"
          class="btn"
          @click="onRelease"
        >
          模拟商家放币
        </button>
      </template>
      <template v-else>
        <button
          v-if="order.status === 'pending_payment'"
          type="button"
          class="btn secondary"
          @click="onRecv"
        >
          确认已收款
        </button>
      </template>

      <button
        v-if="order.status === 'pending_payment'"
        type="button"
        class="btn ghost"
        @click="onCancel"
      >
        取消订单
      </button>

      <button type="button" class="link" @click="router.push({ name: RouteNames.MobileMeOrders })">
        查看我的订单列表 →
      </button>
    </template>
    <p v-else class="err">订单不存在</p>
  </div>
</template>

<style scoped lang="scss">
.page {
  padding: 8px 18px 24px;
}

.card {
  padding: 20px;
  border-radius: 20px;
  background: rgba(22, 28, 38, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 20px;

  .st {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 8px;
    background: rgba(77, 196, 255, 0.12);
    color: #4dc4ff;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 12px;
  }

  h2 {
    font-size: 18px;
    margin-bottom: 12px;
  }

  p {
    font-size: 14px;
    color: #8b95a8;
    margin-bottom: 8px;

    b {
      color: #2ee6c8;
    }
  }

  .id {
    font-size: 11px;
    opacity: 0.7;
    word-break: break-all;
  }
}

.btn {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 12px;
  background: linear-gradient(180deg, #3ee6c4 0%, #1fb89a 100%);
  color: #061210;

  &.secondary {
    background: linear-gradient(180deg, rgba(77, 196, 255, 0.45) 0%, rgba(77, 196, 255, 0.15) 100%);
    color: #eef2f7;
    border: 1px solid rgba(77, 196, 255, 0.35);
  }

  &.ghost {
    background: transparent;
    color: #8b95a8;
    border: 1px solid rgba(255, 255, 255, 0.12);
    margin-bottom: 0;
  }
}

.link {
  width: 100%;
  margin-top: 16px;
  border: none;
  background: none;
  color: #4dc4ff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.err {
  text-align: center;
  padding: 40px;
  color: #e89898;
}
</style>
