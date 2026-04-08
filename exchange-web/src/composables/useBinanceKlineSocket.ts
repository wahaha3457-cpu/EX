import { ref } from 'vue'
import type { BinanceKlineInterval } from '@/api/binance/binancePublic'
import { binanceKlineWsPath } from '@/api/binance/binancePublic'

/** 单路流：/ws/{stream} */
const WS_SINGLE = 'wss://stream.binance.com:9443/ws'
/** 组合流：同时订阅 K 线 + 成交（成交价推送更密，适合展示「最新价」） */
const WS_COMBINED = 'wss://stream.binance.com:9443/stream'

export interface BinanceWsKlinePayload {
  openTime: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  /** 当前 K 线是否已结束 */
  isFinal: boolean
}

export interface UseBinanceKlineSocketOptions {
  symbol: () => string
  interval: () => BinanceKlineInterval
  onKline: (payload: BinanceWsKlinePayload) => void
  /** 逐笔成交名义价格（@trade 的 p），用于头部实时价；传入后会使用组合流 URL */
  onTradePrice?: (price: number) => void
  onFatal?: (message: string) => void
}

function symbolKey(symbol: string): string {
  return symbol.replace(/[^A-Za-z0-9]/g, '').toLowerCase()
}

/**
 * Binance K 线 WebSocket（可选叠加 @trade 实时价）；断线后每 2s 自动重连。
 * 与是否部署无关：本地 dev 即可直连 wss://stream.binance.com（若网络/地区屏蔽则需自行代理）。
 */
export function useBinanceKlineSocket() {
  const connected = ref(false)
  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let closedByUser = false
  let opts: UseBinanceKlineSocketOptions | null = null

  function clearReconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  function scheduleReconnect() {
    clearReconnect()
    if (closedByUser || !opts) return
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connect()
    }, 2000)
  }

  function handleKlinePayload(k: {
    t: number
    o: string
    h: string
    l: string
    c: string
    v: string
    x: boolean
  }) {
    opts?.onKline({
      openTime: k.t,
      open: parseFloat(k.o),
      high: parseFloat(k.h),
      low: parseFloat(k.l),
      close: parseFloat(k.c),
      volume: parseFloat(k.v),
      isFinal: k.x,
    })
  }

  function dispatchMessage(raw: string) {
    const msg = JSON.parse(raw) as Record<string, unknown>

    // 组合流：{ stream, data }
    const stream = msg.stream as string | undefined
    const data = msg.data as Record<string, unknown> | undefined
    if (stream && data) {
      if (data.e === 'trade' && typeof data.p === 'string' && opts?.onTradePrice) {
        opts.onTradePrice(parseFloat(data.p))
        return
      }
      if (data.e === 'kline' && data.k && typeof data.k === 'object') {
        handleKlinePayload(data.k as Parameters<typeof handleKlinePayload>[0])
      }
      return
    }

    // 单路 /ws：根对象即为 kline 包
    const e = msg.e as string | undefined
    const k = msg.k as Parameters<typeof handleKlinePayload>[0] | undefined
    if (e === 'kline' && k) {
      handleKlinePayload(k)
    }
  }

  function connect() {
    if (!opts) return
    clearReconnect()
    closedByUser = false
    const sym = symbolKey(opts.symbol())
    const interval = opts.interval()
    const useTrade = !!opts.onTradePrice

    let url: string
    if (useTrade) {
      const streams = `${sym}@kline_${interval}/${sym}@trade`
      url = `${WS_COMBINED}?streams=${streams}`
    } else {
      url = `${WS_SINGLE}/${binanceKlineWsPath(opts.symbol(), interval)}`
    }

    try {
      ws = new WebSocket(url)
    } catch {
      opts.onFatal?.('无法创建 WebSocket')
      scheduleReconnect()
      return
    }

    ws.onopen = () => {
      connected.value = true
    }

    ws.onmessage = (ev) => {
      try {
        dispatchMessage(ev.data as string)
      } catch {
        /* ignore malformed */
      }
    }

    ws.onerror = () => {
      connected.value = false
    }

    ws.onclose = () => {
      connected.value = false
      ws = null
      if (!closedByUser) scheduleReconnect()
    }
  }

  function start(options: UseBinanceKlineSocketOptions) {
    opts = options
    closedByUser = false
    connect()
  }

  function stop() {
    closedByUser = true
    clearReconnect()
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close()
    }
    ws = null
    connected.value = false
    opts = null
  }

  return {
    connected,
    start,
    stop,
  }
}
