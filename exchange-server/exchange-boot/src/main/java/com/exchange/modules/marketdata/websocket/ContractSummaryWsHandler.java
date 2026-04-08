package com.exchange.modules.marketdata.websocket;

import com.exchange.modules.marketdata.util.Symbols;
import java.time.Duration;
import java.util.List;
import org.springframework.web.socket.WebSocketSession;

public class ContractSummaryWsHandler extends AbstractMarketWsHandler {

  public ContractSummaryWsHandler(MarketWsHub hub) {
    super(hub);
  }

  @Override
  public void afterConnectionEstablished(WebSocketSession session) {
    String symbol = lastPath(session, 1);
    String sym = Symbols.normalizeUnified(symbol);
    String channel = "contract:summary:" + sym;
    hub.join(
        channel,
        session,
        () ->
            hub.ensurePoller(
                channel,
                Duration.ofSeconds(1),
                () ->
                    hub.broadcast(
                        channel, hub.payload("contractSummary", hub.contractSummary(sym)))));
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
}

