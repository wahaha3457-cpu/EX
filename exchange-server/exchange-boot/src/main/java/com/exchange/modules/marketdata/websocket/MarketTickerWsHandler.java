package com.exchange.modules.marketdata.websocket;

import com.exchange.modules.marketdata.domain.MarketDataType;
import java.time.Duration;
import org.springframework.web.socket.WebSocketSession;

public class MarketTickerWsHandler extends AbstractMarketWsHandler {

  public MarketTickerWsHandler(MarketWsHub hub) {
    super(hub);
  }

  @Override
  public void afterConnectionEstablished(WebSocketSession session) {
    String type = param(session, "type", "spot");
    MarketDataType t = "contract".equalsIgnoreCase(type) ? MarketDataType.CONTRACT : MarketDataType.SPOT;
    String channel = "ticker:" + t.name().toLowerCase();
    hub.join(
        channel,
        session,
        () ->
            hub.ensurePoller(
                channel,
                Duration.ofSeconds(2),
                () -> hub.broadcast(channel, hub.payload("ticker", hub.tickers(t)))));
  }

  private static String param(WebSocketSession s, String k, String def) {
    if (s.getUri() == null || s.getUri().getQuery() == null) return def;
    String q = s.getUri().getQuery();
    for (String part : q.split("&")) {
      String[] kv = part.split("=", 2);
      if (kv.length == 2 && kv[0].equals(k)) return kv[1];
    }
    return def;
  }
}

