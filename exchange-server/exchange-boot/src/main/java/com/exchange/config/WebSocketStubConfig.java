package com.exchange.config;

import com.exchange.modules.marketdata.websocket.MarketWsHandlers;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * 交易所行情 WebSocket：轻量自定义协议（非 STOMP）。
 *
 * <p>路径遵循：
 * - /ws/market/ticker
 * - /ws/market/depth/{symbol}
 * - /ws/market/trades/{symbol}
 * - /ws/market/kline/{symbol}/{period}
 * - /ws/contract/summary/{symbol}
 */
@Configuration
@EnableWebSocket
public class WebSocketStubConfig implements WebSocketConfigurer {

  private final MarketWsHandlers handlers;

  public WebSocketStubConfig(MarketWsHandlers handlers) {
    this.handlers = handlers;
  }

  @Override
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry.addHandler(handlers.marketTicker(), "/ws/market/ticker").setAllowedOriginPatterns("*");
    registry
        .addHandler(handlers.marketDepth(), "/ws/market/depth/*")
        .setAllowedOriginPatterns("*");
    registry
        .addHandler(handlers.marketTrades(), "/ws/market/trades/*")
        .setAllowedOriginPatterns("*");
    registry
        .addHandler(handlers.marketKline(), "/ws/market/kline/*/*")
        .setAllowedOriginPatterns("*");
    registry
        .addHandler(handlers.contractSummary(), "/ws/contract/summary/*")
        .setAllowedOriginPatterns("*");
  }
}
