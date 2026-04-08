package com.exchange.modules.marketdata.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.WebSocketHandler;

@Configuration
@RequiredArgsConstructor
public class MarketWsHandlers {

  private final MarketWsHub hub;

  @Bean
  public WebSocketHandler marketTicker() {
    return new MarketTickerWsHandler(hub);
  }

  @Bean
  public WebSocketHandler marketDepth() {
    return new MarketDepthWsHandler(hub);
  }

  @Bean
  public WebSocketHandler marketTrades() {
    return new MarketTradesWsHandler(hub);
  }

  @Bean
  public WebSocketHandler marketKline() {
    return new MarketKlineWsHandler(hub);
  }

  @Bean
  public WebSocketHandler contractSummary() {
    return new ContractSummaryWsHandler(hub);
  }
}

