import type { App } from 'vue'
import ElementPlus from 'element-plus'

/** 样式在 main.ts 中先于 main.scss 引入，保证主题 token 能覆盖 EP :root */

/** 组件语言由根节点 <el-config-provider :locale> 提供，避免与 vue-i18n 双源 */
export function installElementPlus(app: App) {
  app.use(ElementPlus, {
    size: 'default',
  })
}
