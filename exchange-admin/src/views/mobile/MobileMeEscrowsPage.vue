<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useMobileDemoStore } from '@/stores/mobileDemo'
import MpBackBar from '@/components/mobile/MpBackBar.vue'

const router = useRouter()
const demo = useMobileDemoStore()
const { escrows } = storeToRefs(demo)

const escrowLabel: Record<string, string> = {
  holding: '托管中',
  delivered: '待确认收货',
  pending_release: '待放款',
  completed: '已完成',
  cancelled: '已取消',
}
</script>

<template>
  <div class="page">
    <MpBackBar title="我的托管" />
    <button
      v-for="e in escrows"
      :key="e.id"
      type="button"
      class="row"
      @click="router.push({ name: RouteNames.MobileEscrowDetail, params: { id: e.id } })"
    >
      <div>
        <strong>{{ e.title }}</strong>
        <small :class="{ dim: e.status === 'cancelled' }">
          {{ e.amountUsdt }} USDT · {{ escrowLabel[e.status] ?? e.status }}
        </small>
      </div>
      <span>→</span>
    </button>
    <div v-if="!escrows.length" class="empty">
      <p>暂无托管</p>
      <button type="button" @click="router.push({ name: RouteNames.MobilePublishEscrow })">
        创建托管
      </button>
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
