import type { RouteLocationNormalizedLoaded } from 'vue-router'

/** 与侧栏面包屑一致：取最后一级带 title 的 matched 作为页签标题 */
export function getAdminRouteLeafTitle(
  route: RouteLocationNormalizedLoaded,
  t: (key: string) => string,
): string {
  const matched = route.matched.filter((r) => r.meta?.titleKey || r.meta?.title)
  const last = matched[matched.length - 1]
  if (!last) {
    const n = route.name
    return typeof n === 'string' ? n : '页面'
  }
  if (last.meta.titleKey) return t(last.meta.titleKey as string) as string
  return (last.meta.title as string) || '页面'
}
