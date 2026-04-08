/**
 * 运营后台主题与全站共用同一套 Pinia 与 DOM 标记，便于前后台一致与运维排查。
 *
 * - 状态：`useThemeStore()`（`@/stores/theme`）
 * - 持久化：`EXCHANGE_THEME_STORAGE_KEY`（`localStorage`，与前台共用）
 * - DOM：`document.documentElement` 上 `data-theme="default" | "monochrome"`，及 EP 的 `dark` class
 *
 * 新页面/新组件请勿自行写主题 localStorage；需要跟随黑白切换时，用 `[data-theme='monochrome']` 写覆盖样式，
 * 或优先使用 CSS 变量（`--el-*` 在 monochrome 下已由全站主题层接管）。
 */
export type { ThemeMode } from '@/utils/theme/constants'
export { EXCHANGE_THEME_STORAGE_KEY } from '@/utils/theme/constants'
