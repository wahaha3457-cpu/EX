import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { installElementPlus } from './plugins/element-plus'
import { i18n } from '@/i18n'
import { useThemeStore } from '@/stores/theme'
import { usePreferencesStore } from '@/stores/preferences'
/**
 * 样式顺序：EP 浅色 :root → EP 深色变量（仅 html.dark 生效）→ 交易所主题与覆盖。
 * 深色终端（default）需在 documentElement 上存在 class `dark`（与 data-theme 同步，见 utils/theme/dom.ts）。
 */
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './styles/main.scss'
import './styles/admin/index.scss'

/** Mock 或开发/演示找回密码回退均需内存演示账号（与 isMockMode 可独立） */
const seedAuthDemoUsers =
  import.meta.env.VITE_USE_MOCK === 'true' ||
  import.meta.env.VITE_DEMO_PASSWORD_RESET === 'true' ||
  import.meta.env.DEV

if (seedAuthDemoUsers) {
  void import('@/mocks/authMockService').then((m) => {
    m.mockSeedDemoUser()
    m.mockSeedAdminUser()
  })
}

const app = createApp(App)
const pinia = createPinia()
installElementPlus(app)
app.use(i18n)
app.use(pinia)
useThemeStore().initTheme()
usePreferencesStore().init()
app.use(router)
app.mount('#app')
