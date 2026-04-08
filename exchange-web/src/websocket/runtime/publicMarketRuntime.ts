import { ExchangeWebSocket } from '@/websocket/core/ExchangeWebSocket'
import { WsMessageDispatcher } from '@/websocket/router/WsMessageDispatcher'
import { RefCountedSubscriptionManager } from '@/websocket/subscription/RefCountedSubscriptionManager'
import { getPublicWsUrl } from '@/websocket/config/wsEnv'

export interface PublicMarketRuntime {
  ws: ExchangeWebSocket
  dispatcher: WsMessageDispatcher
  subs: RefCountedSubscriptionManager
}

let singleton: PublicMarketRuntime | null = null

/** 懒创建单例：公共行情一条连接多频道复用 */
export function getPublicMarketRuntime(): PublicMarketRuntime {
  const url = getPublicWsUrl()
  if (!url) {
    throw new Error('[ws] VITE_WS_PUBLIC_URL 未配置')
  }
  if (!singleton) {
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

/** 登出 / 全站切环境时销毁（会断线；订阅需业务层重新 acquire） */
export function destroyPublicMarketRuntime() {
  if (!singleton) return
  singleton.ws.close()
  singleton.dispatcher.clear()
  singleton.subs.reset()
  singleton = null
}
