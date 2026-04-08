<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useMobileDemoStore } from '@/stores/mobileDemo'
import { useAppStore } from '@/stores/app'
import MpBackBar from '@/components/mobile/MpBackBar.vue'

const router = useRouter()
const demo = useMobileDemoStore()
const app = useAppStore()
const { notifications } = storeToRefs(demo)

const sorted = computed(() => [...notifications.value].sort((a, b) => b.at - a.at))
const hasUnread = computed(() => sorted.value.some((n) => !n.read))

function fmt(at: number) {
  const d = new Date(at)
  return d.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function markAll() {
  demo.markAllInboxRead()
  app.pushToast('success', '已全部标为已读')
}
</script>

<template>
  <div class="page">
    <MpBackBar title="消息" />
    <div class="bar">
      <p class="hint">订单、任务、托管与资产动态会推送到此处（演示）。</p>
      <button v-if="hasUnread" type="button" class="all" @click="markAll">全部已读</button>
    </div>

    <button
      v-for="n in sorted"
      :key="n.id"
      type="button"
      class="row"
      :class="{ unread: !n.read }"
      @click="router.push({ name: RouteNames.MobileInboxDetail, params: { id: n.id } })"
    >
      <span class="dot" :class="{ on: !n.read }" />
      <div class="body">
        <strong>{{ n.title }}</strong>
        <p>{{ n.preview }}</p>
        <time>{{ fmt(n.at) }}</time>
      </div>
      <span class="arr">→</span>
    </button>

    <div v-if="!sorted.length" class="empty">
      <p>暂无通知</p>
      <button type="button" @click="router.push({ name: RouteNames.MobileMarket })">去市场看看</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page {
  padding: 8px 18px 24px;
}

.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 16px;
}

.hint {
  flex: 1;
  min-width: 200px;
  font-size: 12px;
  color: #8b95a8;
  line-height: 1.45;
}

.all {
  flex-shrink: 0;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(46, 230, 200, 0.3);
  background: rgba(46, 230, 200, 0.08);
  color: #2ee6c8;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.row {
  width: 100%;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 16px 14px;
  margin-bottom: 10px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(22, 28, 38, 0.82);
  cursor: pointer;
  color: inherit;
  font: inherit;
  text-align: left;

  &.unread {
    border-color: rgba(46, 230, 200, 0.22);
    background: rgba(46, 230, 200, 0.05);
  }
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
  background: transparent;

  &.on {
    background: #2ee6c8;
    box-shadow: 0 0 10px rgba(46, 230, 200, 0.5);
  }
}

.body {
  flex: 1;
  min-width: 0;

  strong {
    display: block;
    font-size: 14px;
    margin-bottom: 6px;
    line-height: 1.3;
  }

  p {
    font-size: 12px;
    color: #8b95a8;
    line-height: 1.4;
    margin-bottom: 6px;
  }

  time {
    font-size: 11px;
    color: #6b7280;
  }
}

.arr {
  flex-shrink: 0;
  color: #4dc4ff;
  margin-top: 4px;
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
