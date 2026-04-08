<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useMobileDemoStore } from '@/stores/mobileDemo'
import MpBackBar from '@/components/mobile/MpBackBar.vue'

const router = useRouter()
const demo = useMobileDemoStore()
const { myPublishedTasks } = storeToRefs(demo)

const taskLabel: Record<string, string> = {
  open: '待接单',
  in_progress: '进行中',
  delivered: '待验收',
  pending_confirm_done: '待完成',
  completed: '已完成',
  cancelled: '已取消',
}
</script>

<template>
  <div class="page">
    <MpBackBar title="我发布的任务" />
    <button
      v-for="t in myPublishedTasks"
      :key="t.id"
      type="button"
      class="row"
      @click="router.push({ name: RouteNames.MobileTaskDetail, params: { id: t.id } })"
    >
      <div>
        <strong>{{ t.title }}</strong>
        <small :class="{ dim: t.status === 'cancelled' }">
          {{ t.rewardUsdt }} USDT · {{ taskLabel[t.status] ?? t.status }}
        </small>
      </div>
      <span>→</span>
    </button>
    <div v-if="!myPublishedTasks.length" class="empty">
      <p>暂无任务</p>
      <button type="button" @click="router.push({ name: RouteNames.MobilePublishTask })">
        立即发布
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
    background: linear-gradient(180deg, #3ee6c4 0%, #1fb89a 100%);
    color: #061210;
    font-weight: 700;
    cursor: pointer;
  }
}
</style>
