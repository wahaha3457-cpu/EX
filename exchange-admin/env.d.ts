/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_BASE: string
  /** 独立运营后台构建为 true，路由前缀走根路径而非 /admin */
  readonly VITE_ADMIN_STANDALONE?: string
  /** 主站浏览器跳转独立后台完整 origin（如 http://127.0.0.1:5174） */
  readonly VITE_ADMIN_PORTAL_URL?: string
  /** 独立后台内「返回交易前台」链接 */
  readonly VITE_EXCHANGE_PUBLIC_URL?: string
  readonly VITE_USE_MOCK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
