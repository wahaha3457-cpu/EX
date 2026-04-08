package com.exchange.modules.marketdata.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@RequiredArgsConstructor
public abstract class AbstractMarketWsHandler extends TextWebSocketHandler {

  protected final MarketWsHub hub;

  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
    hub.onClose(session, status);
  }

  @Override
  protected void handleTextMessage(WebSocketSession session, TextMessage message) {
    // 轻协议：本期不需要客户端发送订阅消息（连接即订阅）。
    // 预留：后续可支持 {"op":"sub","channel":"..."} 动态订阅。
  }
}

