import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** @deprecated 使用 titleKey + i18n */
    title?: string
    /** 文档标题与认证页标题：`routes.meta.*` */
    titleKey?: string
    /** 模拟现货等：与实盘共用页面组件时区分模式 */
    demoMode?: boolean
    requiresAuth?: boolean
    guestOnly?: boolean
    /** 运营后台路由：配合 roles 校验 */
    requiresAdmin?: boolean
    /** 用户管理子模块键，见 adminUserModules */
    userModule?: string
    /** 业务/订单管理子模块键，见 adminOrderModules */
    orderModule?: string
    /** 配置管理子模块键，见 adminConfigModules */
    configModule?: string
    /** 系统管理子模块键，见 adminSystemModules */
    systemModule?: string
    /** 一级运营页子模块键（币种/交易对等），见 adminTopLevelModules */
    topModule?: string
  }
}
