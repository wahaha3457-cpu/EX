/**
 * 与后端 WebSocket 契约对齐的通用信封（可按交易所文档扩展字段）。
 * 路由键优先顺序：channel → stream → type+symbol
 */

/** 连接状态（供 UI / 监控） */
export type ExchangeWsConnectionState =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'closing'
  | 'closed'
  | 'reconnecting'

/** 入站 JSON 的宽松形状（解析后再收窄） */
export interface ExchangeWsInboundEnvelope {
  op?: string
  /** 业务通道，如 market.BTC_USDT.ticker */
  channel?: string
  /** 部分所使用 stream 名，如 btcusdt@depth@100ms */
  stream?: string
  type?: string
  symbol?: string
  seq?: number
  ts?: number
  data?: unknown
  /** ping/pong / 错误 */
  ping?: unknown
  pong?: unknown
  error?: { code?: string | number; msg?: string; message?: string }
}

export interface ExchangeWsSubscribePayload {
  op: 'subscribe' | 'unsubscribe'
  /** 单所多频道 */
  channels?: string[]
  /** 或单频道字符串 */
  channel?: string
  /** 鉴权后私有订阅可带 params */
  params?: Record<string, unknown>
}

/** 出站心跳（与后端约定一致时可改模板） */
export function defaultHeartbeatPing(): Record<string, string> {
  return { op: 'ping', t: String(Date.now()) }
}
