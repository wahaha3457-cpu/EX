package com.exchange.modules.marketdata.websocket;

import com.exchange.modules.marketdata.domain.MarketDataType;
import com.exchange.modules.marketdata.util.Symbols;
import java.time.Duration;
import java.util.List;
import org.springframework.web.socket.WebSocketSession;

public class MarketKlineWsHandler extends AbstractMarketWsHandler {

  public MarketKlineWsHandler(MarketWsHub hub) {
    super(hub);
  }

  @Override
  public void afterConnectionEstablished(WebSocketSession session) {
    String symbol = lastPath(session, 2); // .../kline/{symbol}/{period}
    String period = lastPath(session, 1);
    String type = param(session, "type", "spot");
    int limit = intParam(session, "limit", 500, 50, 1500);
    MarketDataType t = "contract".equalsIgnoreCase(type) ? MarketDataType.CONTRACT : MarketDataType.SPOT;
    String sym = Symbols.normalizeUnified(symbol);
    String per = period == null ? "1m" : period.trim().toLowerCase();
    String channel = "kline:" + t.name().toLowerCase() + ":" + sym + ":" + per + ":" + limit;
    hub.join(
        channel,
        session,
        () ->
            hub.ensurePoller(
                channel,
                Duration.ofSeconds(2),
                () -> hub.broadcast(channel, hub.payload("kline", hub.kline(t, sym, per, limit)))));
  }

  private static String lastPath(WebSocketSession s, int fromEndIdx) {
    if (s.getUri() == null) return "";
    List<String> parts = List.of(s.getUri().getPath().split("/"));
    for (int i = parts.size() - 1; i >= 0; i--) {
      if (!parts.get(i).isBlank()) {
        if (fromEndIdx == 1) return parts.get(i);
        fromEndIdx--;
      }
    }
    return "";
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

  private static int intParam(WebSocketSession s, String k, int def, int min, int max) {
    String v = param(s, k, String.valueOf(def));
    try {
      int n = Integer.parseInt(v);
      return Math.max(min, Math.min(max, n));
    } catch (Exception e) {
      return def;
    }
  }
}

