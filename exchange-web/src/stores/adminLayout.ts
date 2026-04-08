import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

export interface AdminTabItem {
  fullPath: string
  path: string
  title: string
  name?: string | symbol | null
}

/** 后台壳层：侧栏折叠、多页签 */
export const useAdminLayoutStore = defineStore('adminLayout', () => {
  const sidebarCollapsed = ref(false)
  const tabs = ref<AdminTabItem[]>([])

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setSidebarCollapsed(v: boolean) {
    sidebarCollapsed.value = v
  }

  /** 当前路由同步到页签列表（存在则更新标题） */
  function upsertTabFromRoute(route: RouteLocationNormalizedLoaded, title: string) {
    const fp = route.fullPath
    const hit = tabs.value.find((x) => x.fullPath === fp)
    if (hit) {
      hit.title = title
      hit.path = route.path
      hit.name = route.name
      return
    }
    tabs.value.push({
      fullPath: fp,
      path: route.path,
      title,
      name: route.name,
    })
  }

  function removeTab(fullPath: string): AdminTabItem | null {
    const idx = tabs.value.findIndex((x) => x.fullPath === fullPath)
    if (idx === -1) return null
    const [removed] = tabs.value.splice(idx, 1)
    return removed ?? null
  }

  function closeOtherTabs(keepFullPath: string) {
    tabs.value = tabs.value.filter((x) => x.fullPath === keepFullPath)
  }

  function closeAllTabs() {
    tabs.value = []
  }

  return {
    sidebarCollapsed,
    toggleSidebar,
    setSidebarCollapsed,
    tabs,
    upsertTabFromRoute,
    removeTab,
    closeOtherTabs,
    closeAllTabs,
  }
})
