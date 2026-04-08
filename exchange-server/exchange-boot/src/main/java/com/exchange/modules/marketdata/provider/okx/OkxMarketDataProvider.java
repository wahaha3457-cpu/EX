package com.exchange.modules.marketdata.provider.okx;

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
public class OkxMarketDataProvider implements MarketDataProvider {

  private static final String BASE = "https://www.okx.com";

  private final HttpJsonClient http;

  @Override
  public String name() {
    return "okx";
  }

  @Override
  public int priority() {
    return 30;
  }

  @Override
  public boolean supports(MarketDataType type) {
    return true;
  }

  @Override
  public List<UnifiedTicker> fetchTickers(MarketDataType type) throws Exception {
    String instType = type == MarketDataType.CONTRACT ? "SWAP" : "SPOT";
    JsonNode j = http.getJson(BASE + "/api/v5/market/tickers", Map.of("instType", instType));
    JsonNode data = j.path("data");
    return parseTickers(data, type);
  }

  @Override
  public UnifiedTicker fetchSummary(MarketDataType type, String symbol) throws Exception {
    String sym = Symbols.normalizeUnified(symbol);
    String instId = OkxSymbolMapper.toInstId(type, sym);
    // OKX: 单标的用 /market/ticker；/market/tickers 为列表（部分情况下会忽略 instId）
    JsonNode j = http.getJson(BASE + "/api/v5/market/ticker", Map.of("instId", instId));
    JsonNode data = j.path("data");
    if (data.isArray() && data.size() > 0) {
      return parseTickerObject(data.get(0), type);
    }
    String[] pq = Symbols.splitBaseQuote(sym);
    return UnifiedTicker.builder()
        .symbol(sym)
        .baseCoin(pq[0])
        .quoteCoin(pq[1])
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
    String instId = OkxSymbolMapper.toInstId(type, sym);
    String bar = OkxPeriodMapper.toBar(period);
    JsonNode j =
        http.getJson(
            BASE + "/api/v5/market/candles",
            Map.of("instId", instId, "bar", bar, "limit", String.valueOf(limit)));
    JsonNode data = j.path("data");
    List<UnifiedKline> out = new ArrayList<>();
    if (data != null && data.isArray()) {
      for (JsonNode r : data) {
        // [ ts, o, h, l, c, vol, volCcy, volCcyQuote, confirm ]
        long t = r.get(0).asLong();
        out.add(
            UnifiedKline.builder()
                .time(t)
                .open(dec(r.get(1)))
                .high(dec(r.get(2)))
                .low(dec(r.get(3)))
                .close(dec(r.get(4)))
                .volume(dec(r.get(5)))
                .turnover(dec(r.get(7)))
                .build());
      }
    }
    return out;
  }

  @Override
  public UnifiedDepth fetchDepth(MarketDataType type, String symbol, int limit) throws Exception {
    String sym = Symbols.normalizeUnified(symbol);
    String instId = OkxSymbolMapper.toInstId(type, sym);
    int sz = Math.max(1, Math.min(400, limit));
    JsonNode j =
        http.getJson(
            BASE + "/api/v5/market/books", Map.of("instId", instId, "sz", String.valueOf(sz)));
    JsonNode data = j.path("data");
    JsonNode book = (data.isArray() && data.size() > 0) ? data.get(0) : null;
    List<UnifiedDepth.Level> bids = book != null ? parseLevels(book.path("bids")) : List.of();
    List<UnifiedDepth.Level> asks = book != null ? parseLevels(book.path("asks")) : List.of();
    long ts =
        book != null && book.hasNonNull("ts") ? book.get("ts").asLong() : System.currentTimeMillis();
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
    String instId = OkxSymbolMapper.toInstId(type, sym);
    int lim = Math.max(1, Math.min(500, limit));
    JsonNode j =
        http.getJson(
            BASE + "/api/v5/market/trades", Map.of("instId", instId, "limit", String.valueOf(lim)));
    JsonNode data = j.path("data");
    List<UnifiedTrade> out = new ArrayList<>();
    if (data != null && data.isArray()) {
      for (JsonNode t : data) {
        String side = t.path("side").asText("");
        UnifiedTrade.Side s = "sell".equalsIgnoreCase(side) ? UnifiedTrade.Side.SELL : UnifiedTrade.Side.BUY;
        out.add(
            UnifiedTrade.builder()
                .price(dec(t.get("px")))
                .qty(dec(t.get("sz")))
                .side(s)
                .time(t.path("ts").asLong(System.currentTimeMillis()))
                .tradeId(t.path("tradeId").asText(null))
                .provider(name())
                .build());
      }
    }
    return out;
  }

  @Override
  public UnifiedContractSummary fetchContractSummary(String symbol) throws Exception {
    String sym = Symbols.normalizeUnified(symbol);
    String swapId = OkxSymbolMapper.toInstId(MarketDataType.CONTRACT, sym); // BTC-USDT-SWAP
    String indexId = OkxSymbolMapper.toIndexId(sym); // BTC-USDT

    JsonNode mark =
        http.getJson(
            BASE + "/api/v5/public/mark-price", Map.of("instType", "SWAP", "instId", swapId));
    JsonNode funding = http.getJson(BASE + "/api/v5/public/funding-rate", Map.of("instId", swapId));
    JsonNode oi =
        http.getJson(
            BASE + "/api/v5/public/open-interest", Map.of("instType", "SWAP", "instId", swapId));
    JsonNode idx =
        http.getJson(BASE + "/api/v5/market/index-tickers", Map.of("instId", indexId));

    JsonNode mark0 = first(mark.path("data"));
    JsonNode fund0 = first(funding.path("data"));
    JsonNode oi0 = first(oi.path("data"));
    JsonNode idx0 = first(idx.path("data"));

    return UnifiedContractSummary.builder()
        .symbol(sym)
        .markPrice(dec(mark0.get("markPx")))
        .indexPrice(dec(idx0.get("idxPx")))
        .fundingRate(dec(fund0.get("fundingRate")))
        .nextFundingTime(
            fund0.hasNonNull("nextFundingTime") ? fund0.get("nextFundingTime").asLong() : null)
        .openInterest(dec(oi0.get("oi")))
        .provider(name())
        .ts(System.currentTimeMillis())
        .build();
  }

  private List<UnifiedTicker> parseTickers(JsonNode data, MarketDataType type) {
    List<UnifiedTicker> out = new ArrayList<>();
    if (data == null || !data.isArray()) return out;
    for (JsonNode j : data) {
      out.add(parseTickerObject(j, type));
    }
    return out;
  }

  private UnifiedTicker parseTickerObject(JsonNode j, MarketDataType type) {
    String instId = j.path("instId").asText("");
    String sym = OkxSymbolMapper.toUnifiedSymbol(type, instId);
    String[] pq = Symbols.splitBaseQuote(sym);

    BigDecimal last = dec(j.get("last"));
    BigDecimal open = dec(j.get("open24h"));
    BigDecimal high = dec(j.get("high24h"));
    BigDecimal low = dec(j.get("low24h"));
    BigDecimal volBase = dec(j.get("vol24h"));
    BigDecimal volCcyQuote = dec(j.get("volCcy24h"));
    BigDecimal chgPct = dec(j.get("sodUtc8")).multiply(BigDecimal.ZERO); // placeholder if needed

    BigDecimal priceChange = last.subtract(open);
    BigDecimal priceChangePct = BigDecimal.ZERO;
    if (open.compareTo(BigDecimal.ZERO) > 0) {
      priceChangePct =
          priceChange
              .divide(open, 8, java.math.RoundingMode.HALF_UP)
              .multiply(BigDecimal.valueOf(100));
    }

    long ts = j.hasNonNull("ts") ? j.get("ts").asLong() : System.currentTimeMillis();
    return UnifiedTicker.builder()
        .symbol(sym)
        .baseCoin(pq[0])
        .quoteCoin(pq[1])
        .marketType(type)
        .latestPrice(last)
        .openPrice24h(open)
        .high24h(high)
        .low24h(low)
        .volume24h(volBase)
        .turnover24h(volCcyQuote)
        .priceChange24h(priceChange)
        .priceChangePercent24h(priceChangePct)
        .provider(name())
        .ts(ts)
        .build();
  }

  private static JsonNode first(JsonNode arr) {
    if (arr != null && arr.isArray() && arr.size() > 0) return arr.get(0);
    return com.fasterxml.jackson.databind.node.MissingNode.getInstance();
  }

  private static List<UnifiedDepth.Level> parseLevels(JsonNode arr) {
    List<UnifiedDepth.Level> out = new ArrayList<>();
    if (arr == null || !arr.isArray()) return out;
    for (JsonNode r : arr) {
      // [px, sz, ...]
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

