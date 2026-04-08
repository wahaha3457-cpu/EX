<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { RouteNames } from '@/constants/routeNames'
import { useMobileDemoStore } from '@/stores/mobileDemo'
import MpBackBar from '@/components/mobile/MpBackBar.vue'

const route = useRoute()
const router = useRouter()
const demo = useMobileDemoStore()
const { notifications } = storeToRefs(demo)

const id = computed(() => route.params.id as string)
const item = computed(() => notifications.value.find((x) => x.id === id.value))

onMounted(() => {
  demo.markInboxRead(id.value)
})

function fmt(at: number) {
  return new Date(at).toLocaleString('zh-CN')
}

function goRelated() {
  const n = item.value
  if (!n || n.linkType === 'none') return
  if (n.linkType === 'assets') {
    router.push({ name: RouteNames.MobileAssets })
    return
  }
  if (!n.linkId) return
  if (n.linkType === 'task') router.push({ name: RouteNames.MobileTaskDetail, params: { id: n.linkId } })
  else if (n.linkType === 'order')
    router.push({ name: RouteNames.MobileOtcOrder, params: { id: n.linkId } })
  else if (n.linkType === 'escrow')
    router.push({ name: RouteNames.MobileEscrowDetail, params: { id: n.linkId } })
  else if (n.linkType === 'service')
    router.push({ name: RouteNames.MobileServiceDetail, params: { id: n.linkId } })
}
</script>

<template>
  <div class="page">
    <MpBackBar title="消息详情" />
    <template v-if="item">
      <p class="time">{{ fmt(item.at) }}</p>
      <h1>{{ item.title }}</h1>
      <p class="body">{{ item.body }}</p>

      <button
        v-if="item.linkType !== 'none'"
        type="button"
        class="cta"
        @click="goRelated"
      >
        {{
          item.linkType === 'task'
            ? '查看任务'
            : item.linkType === 'order'
              ? '查看订单'
              : item.linkType === 'escrow'
                ? '查看托管'
                : item.linkType === 'service'
                  ? '查看服务'
                  : '查看资产'
        }}
        →
      </button>
    </template>
    <p v-else class="err">消息不存在或已过期</p>
  </div>
</template>

<style scoped lang="scss">
.page {
  padding: 8px 18px 28px;
}

.time {
  font-size: 12px;
  color: #8b95a8;
  margin-bottom: 12px;
}

h1 {
  font-size: 20px;
  line-height: 1.35;
  margin-bottom: 16px;
}

.body {
  font-size: 15px;
  line-height: 1.6;
  color: #cbd5e1;
  margin-bottom: 24px;
}

.cta {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(180deg, #3ee6c4 0%, #1fb89a 100%);
  color: #061210;
}

.err {
  text-align: center;
  padding: 40px;
  color: #e89898;
}
</style>
