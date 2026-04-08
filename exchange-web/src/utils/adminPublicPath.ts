/**
 * 运营后台在「主站 /admin 子路径」与「独立后台站点根路径」之间切换。
 * 独立站构建时设置 VITE_ADMIN_STANDALONE=true（见 vite.admin.config.ts）。
 */
export function adminPath(relative: string): string {
  const standalone = import.meta.env.VITE_ADMIN_STANDALONE === 'true'
  const r =
    relative === '' || relative === '/'
      ? '/'
      : relative.startsWith('/')
        ? relative
        : `/${relative}`
  if (standalone) return r === '/' ? '/' : r
  if (r === '/') return '/admin'
  return `/admin${r}`
}
