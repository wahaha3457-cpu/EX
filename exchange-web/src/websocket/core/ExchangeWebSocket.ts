import type { ExchangeWsConnectionState } from '@/websocket/types/protocol'
import { defaultHeartbeatPing } from '@/websocket/types/protocol'
import { nextReconnectDelayMs } from '@/websocket/core/reconnectPolicy'

export interface ExchangeWebSocketOptions {
  url: string
  protocols?: string | string[]
  /** 0 表示关闭应用层心跳 */
  heartbeatIntervalMs?: number
  buildPing?: () => Record<string, unknown>
  /** 是否自动重连（用户主动 close 后不重连） */
  reconnect?: boolean
  /** -1 表示无限重试 */
  maxReconnectAttempts?: number
  onMessage?: (raw: string) => void
  onState?: (s: ExchangeWsConnectionState) => void
}

/**
 * 单路 WebSocket：发送队列、应用层心跳、可配置重连。
 * 二进制帧不在此处理；生产若用 Protobuf 可扩展 binaryType 与 decode。
 */
export class ExchangeWebSocket {
  private ws: WebSocket | null = null
  private readonly opts: Required<
    Pick<ExchangeWebSocketOptions, 'reconnect' | 'maxReconnectAttempts' | 'heartbeatIntervalMs'>
  > &
    ExchangeWebSocketOptions

  /** 浏览器环境下为 number；避免与 Node Timeout 类型冲突 */
  private reconnectTimer: number | null = null
  private heartbeatTimer: number | null = null
  private readonly sendQueue: string[] = []
  private reconnectAttempt = 0
  private userClosed = false
  private state: ExchangeWsConnectionState = 'idle'

  constructor(options: ExchangeWebSocketOptions) {
    this.opts = {
      reconnect: options.reconnect ?? true,
      maxReconnectAttempts: options.maxReconnectAttempts ?? -1,
      heartbeatIntervalMs: options.heartbeatIntervalMs ?? 25_000,
      buildPing: options.buildPing ?? (() => defaultHeartbeatPing()),
      ...options,
    }
  }

  getState(): ExchangeWsConnectionState {
    return this.state
  }

  getUrl(): string {
    return this.opts.url
  }

  private setState(s: ExchangeWsConnectionState) {
    this.state = s
    this.opts.onState?.(s)
  }

  connect() {
    if (this.userClosed) {
      this.userClosed = false
    }
    this.clearReconnectTimer()
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return
    }
    this.setState('connecting')
    try {
      const socket = new WebSocket(this.opts.url, this.opts.protocols)
      this.ws = socket

      socket.onopen = () => {
        this.reconnectAttempt = 0
        this.setState('open')
        this.flushSendQueue()
        this.startHeartbeat()
      }

      socket.onmessage = (ev: MessageEvent) => {
        if (typeof ev.data === 'string') {
          this.opts.onMessage?.(ev.data)
        }
      }

      socket.onerror = () => {
        /* 具体错误由 onclose / 业务侧日志处理 */
      }

      socket.onclose = () => {
        this.stopHeartbeat()
        this.ws = null
        if (this.userClosed) {
          this.setState('closed')
          return
        }
        this.setState('reconnecting')
        this.scheduleReconnect()
      }
    } catch {
      this.setState('closed')
      this.scheduleReconnect()
    }
  }

  /** 主动关闭：不再重连，直至再次 connect */
  close(code?: number, reason?: string) {
    this.userClosed = true
    this.clearReconnectTimer()
    this.stopHeartbeat()
    if (this.ws) {
      this.setState('closing')
      try {
        this.ws.close(code, reason)
      } catch {
        /* noop */
      }
      this.ws = null
    }
    this.setState('closed')
  }

  sendJson(obj: Record<string, unknown>) {
    const payload = JSON.stringify(obj)
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(payload)
    } else {
      this.sendQueue.push(payload)
    }
  }

  private flushSendQueue() {
    if (this.ws?.readyState !== WebSocket.OPEN) return
    while (this.sendQueue.length > 0) {
      const s = this.sendQueue.shift()
      if (s) this.ws.send(s)
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    const ms = this.opts.heartbeatIntervalMs
    if (ms <= 0) return
    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const ping = this.opts.buildPing?.() ?? defaultHeartbeatPing()
        this.ws.send(JSON.stringify(ping))
      }
    }, ms)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer != null) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer != null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private scheduleReconnect() {
    if (!this.opts.reconnect || this.userClosed) return
    const max = this.opts.maxReconnectAttempts
    if (max >= 0 && this.reconnectAttempt >= max) {
      this.setState('closed')
      return
    }
    this.reconnectAttempt += 1
    const delay = nextReconnectDelayMs(this.reconnectAttempt - 1)
    this.clearReconnectTimer()
    this.reconnectTimer = window.setTimeout(() => {
      this.connect()
    }, delay)
  }
}
