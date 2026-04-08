<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useMobileDemoStore } from '@/stores/mobileDemo'
import { DEMO_USER } from '@/mocks/mobile/seed'
import { useMobileUiStore } from '@/stores/mobileUiStore'
import MpBackBar from '@/components/mobile/MpBackBar.vue'

const route = useRoute()
const router = useRouter()
const demo = useMobileDemoStore()
const ui = useMobileUiStore()
const { tasks } = storeToRefs(demo)

const task = computed(() => tasks.value.find((x) => x.id === route.params.id as string))

const isPublisher = computed(() => task.value?.publisherId === DEMO_USER)
const isAcceptor = computed(() => task.value?.acceptedBy === DEMO_USER)

const stLabel: Record<string, string> = {
  open: '待接单',
  in_progress: '进行中',
  delivered: '待验收',
  pending_confirm_done: '待验收',
  completed: '已完成',
  cancelled: '已取消',
}

async function accept() {
  if (!task.value) return
  const ok = await ui.openConfirm({
    title: '接单确认',
    message: `承接「${task.value.title}」？`,
    confirmText: '接单',
  })
  if (ok && demo.acceptTask(task.value.id)) {
    router.push({ name: RouteNames.MobileMeAccepts })
  }
}

async function deliver() {
  if (!task.value) return
  const ok = await ui.openConfirm({
    title: '提交交付',
    message: '演示：标记为已交付，等待发布方确认。',
    confirmText: '提交',
  })
  if (ok) demo.submitTaskDelivery(task.value.id)
}

async function confirmDone() {
  if (!task.value) return
  const ok = await ui.openConfirm({
    title: '确认验收',
    message: '确认任务完成并结算赏金（若开启托管）？',
    confirmText: '确认完成',
  })
  if (ok) demo.confirmTaskDone(task.value.id)
}

async function cancelPublished() {
  if (!task.value) return
  const ok = await ui.openConfirm({
    title: '取消任务',
    message: task.value.needEscrow
      ? '取消后任务下架，托管赏金将退回可用余额（演示）。'
      : '取消后任务从市场下架（演示）。',
    confirmText: '确认取消',
    dangerous: true,
  })
  if (ok) demo.cancelPublishedTask(task.value.id)
}
</script>

<template>
  <div class="page">
    <MpBackBar title="任务详情" />
    <template v-if="task">
      <div class="card">
        <span class="tag">{{ task.category }}</span>
        <span class="st">{{ stLabel[task.status] ?? task.status }}</span>
        <h2>{{ task.title }}</h2>
        <p class="rw">赏金 <b>{{ task.rewardUsdt }} USDT</b></p>
        <p class="sub">截止 {{ task.deadline }} · 托管 {{ task.needEscrow ? '是' : '否' }}</p>
        <p class="des">{{ task.description }}</p>
        <p v-if="task.attachmentNames.length" class="att">
          附件：{{ task.attachmentNames.join('、') }}
        </p>
      </div>

      <button
        v-if="task.status === 'open' && !isPublisher"
        type="button"
        class="cta"
        @click="accept"
      >
        立即接单
      </button>
      <button
        v-if="isAcceptor && task.status === 'in_progress'"
        type="button"
        class="cta"
        @click="deliver"
      >
        提交交付
      </button>
      <button
        v-if="isPublisher && task.status === 'delivered'"
        type="button"
        class="cta"
        @click="confirmDone"
      >
        确认验收完成
      </button>
      <button
        v-if="isPublisher && task.status === 'open'"
        type="button"
        class="cta danger"
        @click="cancelPublished"
      >
        取消任务
      </button>

      <div class="links">
        <button type="button" class="link" @click="router.push({ name: RouteNames.MobileMeTasks })">
          我发布的任务 →
        </button>
        <button type="button" class="link" @click="router.push({ name: RouteNames.MobileMeAccepts })">
          我的接单 →
        </button>
      </div>
    </template>
    <p v-else class="err">任务不存在</p>
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
  margin-bottom: 20px;

  .tag {
    font-size: 10px;
    font-weight: 700;
    color: #4dc4ff;
    margin-right: 8px;
  }

  .st {
    font-size: 11px;
    color: #e8b86d;
    font-weight: 600;
  }

  h2 {
    font-size: 20px;
    margin: 12px 0;
    line-height: 1.35;
  }

  .rw b {
    color: #2ee6c8;
    font-size: 20px;
  }

  .sub {
    font-size: 12px;
    color: #8b95a8;
    margin-bottom: 12px;
  }

  .des {
    font-size: 14px;
    line-height: 1.5;
    color: #cbd5e1;
  }

  .att {
    margin-top: 12px;
    font-size: 12px;
    color: #8b95a8;
  }
}

.cta {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(180deg, #3ee6c4 0%, #1fb89a 100%);
  color: #061210;
  margin-bottom: 12px;

  &.danger {
    background: transparent;
    color: #e89898;
    border: 1px solid rgba(232, 152, 152, 0.45);
  }
}

.links {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.link {
  width: 100%;
  border: none;
  background: none;
  color: #4dc4ff;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 0;
  text-align: left;
}

.err {
  text-align: center;
  padding: 40px;
  color: #e89898;
}
</style>
