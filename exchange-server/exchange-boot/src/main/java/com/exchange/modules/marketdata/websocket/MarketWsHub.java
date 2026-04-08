package com.exchange.modules.marketdata.websocket;

import com.exchange.modules.marketdata.domain.MarketDataType;
import com.exchange.modules.marketdata.service.MarketDataAggregateService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

@Slf4j
@Component
@RequiredArgsConstructor
public class MarketWsHub {

  private final MarketDataAggregateService agg;
  private final ObjectMapper objectMapper;

  private final ScheduledExecutorService scheduler =
      Executors.newScheduledThreadPool(
          4,
          r -> {
            Thread t = new Thread(r);
            t.setName("market-ws-poller");
            t.setDaemon(true);
            return t;
          });

  /** channelKey -> sessions */
  private final Map<String, Set<WebSocketSession>> channels = new ConcurrentHashMap<>();
  /** channelKey -> poller */
  private final Map<String, ScheduledFuture<?>> pollers = new ConcurrentHashMap<>();

  public void join(String channelKey, WebSocketSession session, Runnable startPollerIfNeeded) {
    channels.computeIfAbsent(channelKey, k -> ConcurrentHashMap.newKeySet()).add(session);
    startPollerIfNeeded.run();
  }

  public void leaveAll(WebSocketSession session) {
    for (Map.Entry<String, Set<WebSocketSession>> e : channels.entrySet()) {
      if (e.getValue().remove(session)) {
        if (e.getValue().isEmpty()) {
          stopPoller(e.getKey());
        }
      }
    }
  }

  public void onClose(WebSocketSession session, CloseStatus status) {
    leaveAll(session);
  }

  public void ensurePoller(String channelKey, Duration interval, Runnable task) {
    pollers.computeIfAbsent(
        channelKey,
        k ->
            scheduler.scheduleAtFixedRate(
                () -> {
                  try {
                    task.run();
                  } catch (Exception e) {
                    log.warn("[ws] poller error channel={} err={}", channelKey, e.toString());
                  }
                },
                0,
                Math.max(200, interval.toMillis()),
                TimeUnit.MILLISECONDS));
  }

  private void stopPoller(String channelKey) {
    ScheduledFuture<?> f = pollers.remove(channelKey);
    if (f != null) f.cancel(true);
    channels.remove(channelKey);
  }

  public void broadcast(String channelKey, Object payload) {
    Set<WebSocketSession> ss = channels.get(channelKey);
    if (ss == null || ss.isEmpty()) return;
    String json;
    try {
      json = objectMapper.writeValueAsString(payload);
    } catch (Exception e) {
      return;
    }
    TextMessage msg = new TextMessage(json);
    for (WebSocketSession s : ss) {
      try {
        if (!s.isOpen()) continue;
        s.sendMessage(msg);
      } catch (Exception ignored) {
        // ignore
      }
    }
  }

  // ---------- helpers for poll tasks ----------

  public Object payload(String type, Object data) {
    return Map.of("type", type, "ts", System.currentTimeMillis(), "data", data);
  }

  public Object tickers(MarketDataType t) {
    return agg.getTickers(t);
  }

  public Object depth(MarketDataType t, String symbol, int limit) {
    return agg.getDepth(t, symbol, limit);
  }

  public Object trades(MarketDataType t, String symbol, int limit) {
    return agg.getTrades(t, symbol, limit);
  }

  public Object kline(MarketDataType t, String symbol, String period, int limit) {
    return agg.getKlines(t, symbol, period, limit);
  }

  public Object contractSummary(String symbol) {
    return agg.getContractSummary(symbol);
  }
}

