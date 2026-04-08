<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useMobileDemoStore } from '@/stores/mobileDemo'
import MpBackBar from '@/components/mobile/MpBackBar.vue'

const router = useRouter()
const demo = useMobileDemoStore()
const { otcOrders } = storeToRefs(demo)

const map: Record<string, string> = {
  pending_payment: '待支付',
  pending_confirm: '待放币',
  pending_release: '待放行',
  completed: '已完成',
  cancelled: '已取消',
}
</script>

<template>
  <div class="page">
    <MpBackBar title="我的订单" />
    <button
      v-for="o in otcOrders"
      :key="o.id"
      type="button"
      class="row"
      @click="router.push({ name: RouteNames.MobileOtcOrder, params: { id: o.id } })"
    >
      <div>
        <strong>{{ o.side === 'buy' ? '买入' : '卖出' }} · {{ o.merchantName }}</strong>
        <small :class="{ dim: o.status === 'cancelled' }">
          {{ o.amountUsdt }} USDT · {{ map[o.status] ?? o.status }}
        </small>
      </div>
      <span>→</span>
    </button>
    <div v-if="!otcOrders.length" class="empty">
      <p>暂无订单</p>
      <button type="button" @click="router.push({ name: RouteNames.MobileMarket })">去市场</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page {
  padding: 8px 18px 24px;
}

.row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 16px;
  margin-bottom: 10px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(22, 28, 38, 0.82);
  cursor: pointer;
  color: inherit;
  font: inherit;
  text-align: left;

  strong {
    display: block;
    font-size: 15px;
    margin-bottom: 4px;
  }

  small {
    font-size: 12px;
    color: #8b95a8;

    &.dim {
      opacity: 0.65;
      text-decoration: line-through;
      text-decoration-color: rgba(139, 149, 168, 0.5);
    }
  }

  span {
    color: #4dc4ff;
  }
}

.empty {
  text-align: center;
  padding: 48px 16px;
  color: #8b95a8;

  button {
    margin-top: 14px;
    padding: 12px 22px;
    border-radius: 12px;
    border: none;
    background: rgba(46, 230, 200, 0.15);
    color: #2ee6c8;
    font-weight: 700;
    cursor: pointer;
  }
}
</style>
