import { getAccessToken } from '@/utils/tokenStorage'
import { ExchangeWebSocket } from '@/websocket/core/ExchangeWebSocket'
import { WsMessageDispatcher } from '@/websocket/router/WsMessageDispatcher'
import { RefCountedSubscriptionManager } from '@/websocket/subscription/RefCountedSubscriptionManager'
import { getPrivateWsUrl } from '@/websocket/config/wsEnv'

export interface PrivateUserRuntime {
  ws: ExchangeWebSocket
  dispatcher: WsMessageDispatcher
  subs: RefCountedSubscriptionManager
}

let singleton: PrivateUserRuntime | null = null

/**
 * 用户私有连接（订单 / 资产 / 持仓）：建议在登录成功且拿到 token 后创建。
 * URL 可带 query token；若网关要求首包 login，请在连接 open 后 sendJson。
 */
export function getPrivateUserRuntime(): PrivateUserRuntime {
  const base = getPrivateWsUrl()
  if (!base) {
    throw new Error('[ws] VITE_WS_PRIVATE_URL 未配置')
  }
  if (!singleton) {
    const token = getAccessToken()
    const url = token ? `${base}${base.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}` : base
    const dispatcher = new WsMessageDispatcher()
    const ws = new ExchangeWebSocket({
      url,
      onMessage: (raw) => dispatcher.dispatchRaw(raw),
    })
    const subs = new RefCountedSubscriptionManager((msg) => ws.sendJson(msg))
    singleton = { ws, dispatcher, subs }
  }
  return singleton
}

export function destroyPrivateUserRuntime() {
  if (!singleton) return
  singleton.ws.close()
  singleton.dispatcher.clear()
  singleton.subs.reset()
  singleton = null
}

/** Token 轮换后应销毁并重建，避免旧连接无鉴权 */
export function reconnectPrivateUserAfterAuthChange() {
  destroyPrivateUserRuntime()
}
