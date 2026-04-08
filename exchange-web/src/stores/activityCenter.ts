import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fetchActivityList } from '@/api/support/activityMock'
import type { ActivityCenterItem, ActivityStatus } from '@/types/supportHub'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

export type ActivityFilter = 'ALL' | ActivityStatus

export const useActivityCenterStore = defineStore('activityCenter', () => {
  const loading = ref(false)
  const loadError = ref<string | null>(null)
  const items = ref<ActivityCenterItem[]>([])
  const filter = ref<ActivityFilter>('ALL')

  const filtered = computed(() => {
    if (filter.value === 'ALL') return items.value
    return items.value.filter((x) => x.status === filter.value)
  })

  async function bootstrap(force = false) {
    if (items.value.length > 0 && !force) return
    loading.value = true
    loadError.value = null
    try {
      items.value = await fetchActivityList()
    } catch {
      loadError.value = '活动列表加载失败'
    } finally {
      loading.value = false
    }
  }

  function getById(id: string) {
    return items.value.find((x) => x.id === id) ?? null
  }

  function statusLabel(s: ActivityStatus) {
    if (s === 'ONGOING') return '进行中'
    if (s === 'UPCOMING') return '即将开始'
    return '已结束'
  }

  function joinActivity(id: string) {
    if (!useAuthStore().isAuthenticated) {
      useAppStore().pushToast('warning', '请先登录后再报名活动')
      return
    }
    const idx = items.value.findIndex((x) => x.id === id)
    if (idx < 0) return
    const it = items.value[idx]!
    if (it.status !== 'ONGOING') {
      useAppStore().pushToast('info', '当前活动不可报名')
      return
    }
    if (it.joined) {
      useAppStore().pushToast('info', '您已报名该活动')
      return
    }
    items.value.splice(idx, 1, { ...it, joined: true })
    useAppStore().pushToast('success', '报名成功（演示），奖励以活动规则为准')
  }

  return {
    loading,
    loadError,
    items,
    filter,
    filtered,
    bootstrap,
    getById,
    statusLabel,
    joinActivity,
  }
})
