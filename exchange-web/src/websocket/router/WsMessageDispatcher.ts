import type { ExchangeWsInboundEnvelope } from '@/websocket/types/protocol'

type MessageHandler = (payload: unknown, ctx: { raw: string; envelope: ExchangeWsInboundEnvelope }) => void

/**
 * 按「路由键」分发消息；同一键可注册多个监听（如多组件订阅同一 ticker）。
 * 路由键应与 {@link RefCountedSubscriptionManager} 使用的 topic 一致。
 */
export class WsMessageDispatcher {
  private readonly handlers = new Map<string, Set<MessageHandler>>()

  /** 返回取消注册函数 */
  on(routeKey: string, handler: MessageHandler): () => void {
    let set = this.handlers.get(routeKey)
    if (!set) {
      set = new Set()
      this.handlers.set(routeKey, set)
    }
    set.add(handler)
    return () => {
      const s = this.handlers.get(routeKey)
      if (!s) return
      s.delete(handler)
      if (s.size === 0) this.handlers.delete(routeKey)
    }
  }

  /** 解析 JSON 并投递；无法解析或非对象时静默忽略 */
  dispatchRaw(raw: string) {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return
    }
    if (!parsed || typeof parsed !== 'object') return
    const envelope = parsed as ExchangeWsInboundEnvelope
    const keys = extractRouteKeys(envelope)
    for (const key of keys) {
      const set = this.handlers.get(key)
      if (!set) continue
      const payload = envelope.data !== undefined ? envelope.data : envelope
      for (const fn of set) {
        try {
          fn(payload, { raw, envelope })
        } catch {
          /* 业务 handler 自行捕获；此处防止单条拖垮分发 */
        }
      }
    }
  }

  clear() {
    this.handlers.clear()
  }
}

/**
 * 从信封提取路由键（多键兼容：同一帧可被多个 handler 收到）。
 * 生产可改为「只认一种」以减少重复投递。
 */
export function extractRouteKeys(env: ExchangeWsInboundEnvelope): string[] {
  const keys: string[] = []
  if (typeof env.channel === 'string' && env.channel.length > 0) {
    keys.push(env.channel)
  }
  /** 合并流：如 Binance `{ stream: "btcusdt@ticker", data: {...} }`，路由仍用 stream 名 */
  if (typeof env.stream === 'string' && env.stream.length > 0) {
    keys.push(env.stream)
  }
  if (typeof env.type === 'string' && typeof env.symbol === 'string') {
    keys.push(`${env.type}:${env.symbol}`)
  }
  if (keys.length === 0 && typeof env.op === 'string') {
    keys.push(`op:${env.op}`)
  }
  return keys
}
