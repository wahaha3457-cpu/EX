<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useMobileDemoStore } from '@/stores/mobileDemo'
import MpBackBar from '@/components/mobile/MpBackBar.vue'

const router = useRouter()
const demo = useMobileDemoStore()
const { myAcceptedTasks } = storeToRefs(demo)

const taskLabel: Record<string, string> = {
  open: '待接单',
  in_progress: '进行中',
  delivered: '待验收',
  pending_confirm_done: '待完成',
  completed: '已完成',
}
</script>

<template>
  <div class="page">
    <MpBackBar title="我的接单" />
    <button
      v-for="t in myAcceptedTasks"
      :key="t.id"
      type="button"
      class="row"
      @click="router.push({ name: RouteNames.MobileTaskDetail, params: { id: t.id } })"
    >
      <div>
        <strong>{{ t.title }}</strong>
        <small>{{ taskLabel[t.status] ?? t.status }} · {{ t.rewardUsdt }} USDT</small>
      </div>
      <span>→</span>
    </button>
    <div v-if="!myAcceptedTasks.length" class="empty">
      <p>暂无接单</p>
      <button type="button" @click="router.push({ name: RouteNames.MobileMarket, query: { tab: 'tasks' } })">
        去任务市场
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
