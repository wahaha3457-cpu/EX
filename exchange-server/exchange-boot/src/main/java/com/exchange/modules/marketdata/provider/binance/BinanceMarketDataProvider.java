package com.exchange.modules.marketdata.provider.binance;

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
public class BinanceMarketDataProvider implements MarketDataProvider {

  private static final String SPOT_BASE = "https://api.binance.com";
  private static final String FUTURES_BASE = "https://fapi.binance.com";

  private final HttpJsonClient http;

  @Override
  public String name() {
    return "binance";
  }

  @Override
  public int priority() {
    return 10;
  }

  @Override
  public boolean supports(MarketDataType type) {
    return true;
  }

  @Override
  public List<UnifiedTicker> fetchTickers(MarketDataType type) throws Exception {
    if (type == MarketDataType.CONTRACT) {
      JsonNode arr = http.getJson(FUTURES_BASE + "/fapi/v1/ticker/24hr", null);
      return parseTickers(arr, MarketDataType.CONTRACT);
    }
    JsonNode arr = http.getJson(SPOT_BASE + "/api/v3/ticker/24hr", null);
    return parseTickers(arr, MarketDataType.SPOT);
  }

  @Override
  public UnifiedTicker fetchSummary(MarketDataType type, String symbol) throws Exception {
    String sym = Symbols.normalizeUnified(symbol);
    if (type == MarketDataType.CONTRACT) {
      JsonNode j =
          http.getJson(FUTURES_BASE + "/fapi/v1/ticker/24hr", Map.of("symbol", sym));
      return parseTickerObject(j, MarketDataType.CONTRACT);
    }
    JsonNode j = http.getJson(SPOT_BASE + "/api/v3/ticker/24hr", Map.of("symbol", sym));
    return parseTickerObject(j, MarketDataType.SPOT);
  }

  @Override
  public List<UnifiedKline> fetchKlines(MarketDataType type, String symbol, String period, int limit)
      throws Exception {
    String sym = Symbols.normalizeUnified(symbol);
    String interval = BinancePeriodMapper.toInterval(period);
    String base = type == MarketDataType.CONTRACT ? FUTURES_BASE + "/fapi/v1/klines" : SPOT_BASE + "/api/v3/klines";
    JsonNode arr =
        http.getJson(base, Map.of("symbol", sym, "interval", interval, "limit", String.valueOf(limit)));
    List<UnifiedKline> out = new ArrayList<>();
    if (arr != null && arr.isArray()) {
      for (JsonNode row : arr) {
        // [ openTime, open, high, low, close, volume, closeTime, quoteAssetVolume, trades, ... ]
        long t = row.get(0).asLong();
        out.add(
            UnifiedKline.builder()
                .time(t)
                .open(dec(row.get(1)))
                .high(dec(row.get(2)))
                .low(dec(row.get(3)))
                .close(dec(row.get(4)))
                .volume(dec(row.get(5)))
                .turnover(dec(row.get(7)))
                .build());
      }
    }
    return out;
  }

  @Override
  public UnifiedDepth fetchDepth(MarketDataType type, String symbol, int limit) throws Exception {
    String sym = Symbols.normalizeUnified(symbol);
    String base = type == MarketDataType.CONTRACT ? FUTURES_BASE + "/fapi/v1/depth" : SPOT_BASE + "/api/v3/depth";
    JsonNode j = http.getJson(base, Map.of("symbol", sym, "limit", String.valueOf(limit)));
    List<UnifiedDepth.Level> bids = parseLevels(j.get("bids"));
    List<UnifiedDepth.Level> asks = parseLevels(j.get("asks"));
    long ts = System.currentTimeMillis();
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
    String base = type == MarketDataType.CONTRACT ? FUTURES_BASE + "/fapi/v1/trades" : SPOT_BASE + "/api/v3/trades";
    JsonNode arr = http.getJson(base, Map.of("symbol", sym, "limit", String.valueOf(limit)));
    List<UnifiedTrade> out = new ArrayList<>();
    if (arr != null && arr.isArray()) {
      for (JsonNode t : arr) {
        boolean isBuyerMaker = t.path("isBuyerMaker").asBoolean(false);
        UnifiedTrade.Side side = isBuyerMaker ? UnifiedTrade.Side.SELL : UnifiedTrade.Side.BUY;
        out.add(
            UnifiedTrade.builder()
                .price(dec(t.get("price")))
                .qty(dec(t.get("qty")))
                .side(side)
                .time(t.path("time").asLong(System.currentTimeMillis()))
                .tradeId(t.path("id").asText(null))
                .provider(name())
                .build());
      }
    }
    return out;
  }

  @Override
  public UnifiedContractSummary fetchContractSummary(String symbol) throws Exception {
    String sym = Symbols.normalizeUnified(symbol);
    JsonNode premium = http.getJson(FUTURES_BASE + "/fapi/v1/premiumIndex", Map.of("symbol", sym));
    JsonNode oi = http.getJson(FUTURES_BASE + "/fapi/v1/openInterest", Map.of("symbol", sym));
    return UnifiedContractSummary.builder()
        .symbol(sym)
        .markPrice(dec(premium.get("markPrice")))
        .indexPrice(dec(premium.get("indexPrice")))
        .fundingRate(dec(premium.get("lastFundingRate")))
        .nextFundingTime(premium.path("nextFundingTime").isMissingNode() ? null : premium.path("nextFundingTime").asLong())
        .openInterest(dec(oi.get("openInterest")))
        .provider(name())
        .ts(System.currentTimeMillis())
        .build();
  }

  private List<UnifiedTicker> parseTickers(JsonNode arr, MarketDataType type) {
    List<UnifiedTicker> out = new ArrayList<>();
    if (arr == null || !arr.isArray()) return out;
    for (JsonNode j : arr) {
      out.add(parseTickerObject(j, type));
    }
    return out;
  }

  private UnifiedTicker parseTickerObject(JsonNode j, MarketDataType type) {
    String sym = j.path("symbol").asText("");
    String[] pq = Symbols.splitBaseQuote(sym);
    BigDecimal last = dec(j.get("lastPrice"));
    BigDecimal open = dec(j.get("openPrice"));
    BigDecimal change = dec(j.get("priceChange"));
    BigDecimal changePct = dec(j.get("priceChangePercent"));
    return UnifiedTicker.builder()
        .symbol(sym)
        .baseCoin(pq[0])
        .quoteCoin(pq[1])
        .marketType(type)
        .latestPrice(last)
        .openPrice24h(open)
        .high24h(dec(j.get("highPrice")))
        .low24h(dec(j.get("lowPrice")))
        .volume24h(dec(j.get("volume")))
        .turnover24h(dec(j.get("quoteVolume")))
        .priceChange24h(change)
        .priceChangePercent24h(changePct)
        .provider(name())
        .ts(j.path("closeTime").isMissingNode() ? System.currentTimeMillis() : j.path("closeTime").asLong())
        .build();
  }

  private static List<UnifiedDepth.Level> parseLevels(JsonNode arr) {
    List<UnifiedDepth.Level> out = new ArrayList<>();
    if (arr == null || !arr.isArray()) return out;
    for (JsonNode row : arr) {
      // [price, qty]
      out.add(
          UnifiedDepth.Level.builder()
              .price(dec(row.get(0)))
              .amount(dec(row.get(1)))
              .build());
    }
    return out;
  }

  private static BigDecimal dec(JsonNode n) {
    if (n == null || n.isNull() || n.isMissingNode()) return BigDecimal.ZERO;
    String s = n.isTextual() ? n.asText() : n.asText();
    if (s == null || s.isBlank()) return BigDecimal.ZERO;
    try {
      return new BigDecimal(s);
    } catch (Exception e) {
      return BigDecimal.ZERO;
    }
  }
}

