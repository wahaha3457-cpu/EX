/**
 * 交易所前端 WebSocket 层 — 对外统一入口
 *
 * - 核心：{@link ExchangeWebSocket}、{@link WsMessageDispatcher}、{@link RefCountedSubscriptionManager}
 * - 行情运行时：{@link startSpotTradeRealtime}、{@link startFuturesTradeRealtime}
 * - 页面入口：{@link startSpotTradeStreams}、{@link startFuturesTradeStreams}（自动在 mock / 实连间切换）
 */

export { ExchangeWebSocket } from '@/websocket/core/ExchangeWebSocket'
export { nextReconnectDelayMs } from '@/websocket/core/reconnectPolicy'
export * from '@/websocket/types/protocol'
export { getPublicWsUrl, getPrivateWsUrl, isPublicWsConfigured, isPrivateWsConfigured } from '@/websocket/config/wsEnv'
export { WsMessageDispatcher, extractRouteKeys } from '@/websocket/router/WsMessageDispatcher'
export { RefCountedSubscriptionManager } from '@/websocket/subscription/RefCountedSubscriptionManager'
export { SpotChannel, FuturesChannel, UserChannel } from '@/websocket/channels/exchangeChannels'
export { getPublicMarketRuntime, destroyPublicMarketRuntime } from '@/websocket/runtime/publicMarketRuntime'
export {
  getPrivateUserRuntime,
  destroyPrivateUserRuntime,
  reconnectPrivateUserAfterAuthChange,
} from '@/websocket/runtime/privateUserRuntime'
export { startSpotTradeRealtime } from '@/websocket/streams/spotTradeRealtime'
export { startFuturesTradeRealtime } from '@/websocket/streams/futuresTradeRealtime'
export { startSpotKlineRealtime, startFuturesKlineRealtime } from '@/websocket/streams/klineRealtime'
export { subscribeUserOrders } from '@/websocket/streams/userPrivateStreams'
export {
  startSpotTradeStreams,
  stopSpotTradeStreams,
  startSpotTradeMockStreams,
  stopSpotTradeMockStreams,
} from '@/websocket/spotTradeWs'
export {
  startFuturesTradeStreams,
  stopFuturesTradeStreams,
  startFuturesTradeMockStreams,
  stopFuturesTradeMockStreams,
} from '@/websocket/futuresTradeWs'
