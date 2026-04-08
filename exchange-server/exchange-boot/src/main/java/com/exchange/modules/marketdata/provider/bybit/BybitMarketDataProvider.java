package com.exchange.modules.marketdata.provider.bybit;

import com.exchange.modules.marketdata.domain.MarketDataType;
import com.exchange.modules.marketdata.domain.UnifiedContractSummary;
import com.exchange.modules.marketdata.domain.UnifiedDepth;
import com.exchange.modules.marketdata.domain.UnifiedKline;
import com.exchange.modules.marketdata.domain.UnifiedTicker;
import com.exchange.modules.marketdata.domain.UnifiedTrade;
import com.exchange.modules.marketdata.http.HttpJsonClient;
import com.exchange.modules.marketdata.provider.MarketDataProvider;
import com.exchange.modules.marketdata.util.Symbols;
import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BybitMarketDataProvider implements MarketDataProvider {

  private static final String BASE = "https://api.bybit.com";

  private final HttpJsonClient http;

  @Override
  public String name() {
    return "bybit";
  }

  @Override
  public int priority() {
    return 20;
  }

  @Override
  public boolean supports(MarketDataType type) {
    return true;
  }

  @Override
  public List<UnifiedTicker> fetchTickers(MarketDataType type) throws Exception {
    String cat = type == MarketDataType.CONTRACT ? "linear" : "spot";
    JsonNode j = http.getJson(BASE + "/v5/market/tickers", Map.of("category", cat));
    JsonNode list = j.path("result").path("list");
    return parseTickers(list, type);
  }

  @Override
  public UnifiedTicker fetchSummary(MarketDataType type, String symbol) throws Exception {
    String sym = Symbols.normalizeUnified(symbol);
    String cat = type == MarketDataType.CONTRACT ? "linear" : "spot";
    JsonNode j =
        http.getJson(BASE + "/v5/market/tickers", Map.of("category", cat, "symbol", sym));
    JsonNode list = j.path("result").path("list");
    if (list.isArray() && list.size() > 0) {
      return parseTickerObject(list.get(0), type);
    }
    return UnifiedTicker.builder()
        .symbol(sym)
        .baseCoin(Symbols.splitBaseQuote(sym)[0])
        .quoteCoin(Symbols.splitBaseQuote(sym)[1])
        .marketType(type)
        .latestPrice(BigDecimal.ZERO)
        .openPrice24h(BigDecimal.ZERO)
        .high24h(BigDecimal.ZERO)
        .low24h(BigDecimal.ZERO)
        .volume24h(BigDecimal.ZERO)
        .turnover24h(BigDecimal.ZERO)
        .priceChange24h(BigDecimal.ZERO)
        .priceChangePercent24h(BigDecimal.ZERO)
        .provider(name())
        .ts(System.currentTimeMillis())
        .build();
  }

  @Override
  public List<UnifiedKline> fetchKlines(MarketDataType type, String symbol, String period, int limit)
      throws Exception {
    String sym = Symbols.normalizeUnified(symbol);
    String cat = type == MarketDataType.CONTRACT ? "linear" : "spot";
    String interval = BybitPeriodMapper.toInterval(period);
    JsonNode j =
        http.getJson(
            BASE + "/v5/market/kline",
            Map.of("category", cat, "symbol", sym, "interval", interval, "limit", String.valueOf(limit)));
    JsonNode rows = j.path("result").path("list");
    List<UnifiedKline> out = new ArrayList<>();
    if (rows != null && rows.isArray()) {
      for (JsonNode r : rows) {
        // [ startTime, open, high, low, close, volume, turnover ]
        long t = r.get(0).asLong();
        out.add(
            UnifiedKline.builder()
                .time(t)
                .open(dec(r.get(1)))
                .high(dec(r.get(2)))
                .low(dec(r.get(3)))
                .close(dec(r.get(4)))
                .volume(dec(r.get(5)))
                .turnover(dec(r.get(6)))
                .build());
      }
    }
    return out;
  }

  @Override
  public UnifiedDepth fetchDepth(MarketDataType type, String symbol, int limit) throws Exception {
    String sym = Symbols.normalizeUnified(symbol);
    String cat = type == MarketDataType.CONTRACT ? "linear" : "spot";
    JsonNode j =
        http.getJson(
            BASE + "/v5/market/orderbook",
            Map.of("category", cat, "symbol", sym, "limit", String.valueOf(Math.min(200, limit))));
    JsonNode res = j.path("result");
    List<UnifiedDepth.Level> bids = parseLevels(res.path("b"));
    List<UnifiedDepth.Level> asks = parseLevels(res.path("a"));
    long ts = res.path("ts").asLong(System.currentTimeMillis());
    return UnifiedDepth.builder()
        .symbol(sym)
        .marketType(type)
        .timestamp(ts)
        .bids(bids)
        .asks(asks)
        .provider(name())
        .build();
  }

  @Override
  public List<UnifiedTrade> fetchTrades(MarketDataType type, String symbol, int limit) throws Exception {
    String sym = Symbols.normalizeUnified(symbol);
    String cat = type == MarketDataType.CONTRACT ? "linear" : "spot";
    JsonNode j =
        http.getJson(
            BASE + "/v5/market/recent-trade",
            Map.of("category", cat, "symbol", sym, "limit", String.valueOf(Math.min(1000, limit))));
    JsonNode list = j.path("result").path("list");
    List<UnifiedTrade> out = new ArrayList<>();
    if (list != null && list.isArray()) {
      for (JsonNode t : list) {
        String side = t.path("side").asText("");
        UnifiedTrade.Side s = "Sell".equalsIgnoreCase(side) ? UnifiedTrade.Side.SELL : UnifiedTrade.Side.BUY;
        out.add(
            UnifiedTrade.builder()
                .price(dec(t.get("price")))
                .qty(dec(t.get("size")))
                .side(s)
                .time(t.path("time").asLong(System.currentTimeMillis()))
                .tradeId(t.path("execId").asText(null))
                .provider(name())
                .build());
      }
    }
    return out;
  }

  @Override
  public UnifiedContractSummary fetchContractSummary(String symbol) throws Exception {
    String sym = Symbols.normalizeUnified(symbol);
    JsonNode tick =
        http.getJson(BASE + "/v5/market/tickers", Map.of("category", "linear", "symbol", sym));
    JsonNode list = tick.path("result").path("list");
    JsonNode t = (list.isArray() && list.size() > 0) ? list.get(0) : null;

    BigDecimal mark = t != null ? dec(t.get("markPrice")) : BigDecimal.ZERO;
    BigDecimal idx = t != null ? dec(t.get("indexPrice")) : BigDecimal.ZERO;
    BigDecimal fr = t != null ? dec(t.get("fundingRate")) : BigDecimal.ZERO;
    Long nextFunding = t != null && t.hasNonNull("nextFundingTime") ? t.get("nextFundingTime").asLong() : null;

    BigDecimal oi = BigDecimal.ZERO;
    try {
      JsonNode oij =
          http.getJson(
              BASE + "/v5/market/open-interest",
              Map.of("category", "linear", "symbol", sym, "intervalTime", "5min", "limit", "1"));
      JsonNode oilist = oij.path("result").path("list");
      if (oilist.isArray() && oilist.size() > 0) {
        oi = dec(oilist.get(0).get("openInterest"));
      }
    } catch (Exception ignored) {
      // ignore
    }

    return UnifiedContractSummary.builder()
        .symbol(sym)
        .markPrice(mark)
        .indexPrice(idx)
        .fundingRate(fr)
        .nextFundingTime(nextFunding)
        .openInterest(oi)
        .provider(name())
        .ts(System.currentTimeMillis())
        .build();
  }

  private List<UnifiedTicker> parseTickers(JsonNode list, MarketDataType type) {
    List<UnifiedTicker> out = new ArrayList<>();
    if (list == null || !list.isArray()) return out;
    for (JsonNode j : list) {
      out.add(parseTickerObject(j, type));
    }
    return out;
  }

  private UnifiedTicker parseTickerObject(JsonNode j, MarketDataType type) {
    String sym = j.path("symbol").asText("");
    String[] pq = Symbols.splitBaseQuote(sym);
    BigDecimal last = dec(j.get("lastPrice"));
    BigDecimal open = dec(j.get("prevPrice24h"));
    BigDecimal high = dec(j.get("highPrice24h"));
    BigDecimal low = dec(j.get("lowPrice24h"));
    BigDecimal vol = dec(j.get("volume24h"));
    BigDecimal turnover = dec(j.get("turnover24h"));
    BigDecimal chg = dec(j.get("price24hPcnt")).multiply(BigDecimal.valueOf(100));
    BigDecimal priceChange = last.subtract(open);
    return UnifiedTicker.builder()
        .symbol(sym)
        .baseCoin(pq[0])
        .quoteCoin(pq[1])
        .marketType(type)
        .latestPrice(last)
        .openPrice24h(open)
        .high24h(high)
        .low24h(low)
        .volume24h(vol)
        .turnover24h(turnover)
        .priceChange24h(priceChange)
        .priceChangePercent24h(chg)
        .provider(name())
        .ts(System.currentTimeMillis())
        .build();
  }

  private static List<UnifiedDepth.Level> parseLevels(JsonNode arr) {
    List<UnifiedDepth.Level> out = new ArrayList<>();
    if (arr == null || !arr.isArray()) return out;
    for (JsonNode r : arr) {
      // [price, size]
      out.add(
          UnifiedDepth.Level.builder()
              .price(dec(r.get(0)))
              .amount(dec(r.get(1)))
              .build());
    }
    return out;
  }

  private static BigDecimal dec(JsonNode n) {
    if (n == null || n.isNull() || n.isMissingNode()) return BigDecimal.ZERO;
    String s = n.asText();
    if (s == null || s.isBlank()) return BigDecimal.ZERO;
    try {
      return new BigDecimal(s);
    } catch (Exception e) {
      return BigDecimal.ZERO;
    }
  }
}

