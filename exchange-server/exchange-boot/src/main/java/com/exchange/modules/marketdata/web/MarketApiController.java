package com.exchange.modules.marketdata.web;

import com.exchange.common.api.Result;
import com.exchange.modules.marketdata.domain.MarketDataType;
import com.exchange.modules.marketdata.domain.UnifiedDepth;
import com.exchange.modules.marketdata.domain.UnifiedKline;
import com.exchange.modules.marketdata.domain.UnifiedTicker;
import com.exchange.modules.marketdata.domain.UnifiedTrade;
import com.exchange.modules.marketdata.service.MarketDataAggregateService;
import com.exchange.modules.marketdata.util.Symbols;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/market")
@RequiredArgsConstructor
public class MarketApiController {

  private final MarketDataAggregateService agg;

  @GetMapping("/tickers")
  public Result<List<UnifiedTicker>> tickers(
      @RequestParam(defaultValue = "spot") String type,
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false) String quoteCoin,
      @RequestParam(required = false) String sortBy,
      @RequestParam(required = false, defaultValue = "desc") String order) {
    MarketDataType t = "contract".equalsIgnoreCase(type) ? MarketDataType.CONTRACT : MarketDataType.SPOT;
    List<UnifiedTicker> list = agg.getTickers(t);

    String q = keyword != null ? keyword.trim().toUpperCase() : "";
    String qc = quoteCoin != null ? quoteCoin.trim().toUpperCase() : "";
    if (!q.isBlank()) {
      list =
          list.stream()
              .filter(
                  x ->
                      x.getSymbol().contains(q)
                          || (x.getBaseCoin() != null && x.getBaseCoin().contains(q))
                          || (x.getQuoteCoin() != null && x.getQuoteCoin().contains(q)))
              .toList();
    }
    if (!qc.isBlank()) {
      list = list.stream().filter(x -> qc.equalsIgnoreCase(x.getQuoteCoin())).toList();
    }

    Comparator<UnifiedTicker> cmp = comparator(sortBy);
    boolean asc = "asc".equalsIgnoreCase(order);
    list = list.stream().sorted(asc ? cmp : cmp.reversed()).toList();
    return Result.ok(list);
  }

  @GetMapping("/tickers/hot")
  public Result<List<UnifiedTicker>> hot(
      @RequestParam(defaultValue = "spot") String type, @RequestParam(defaultValue = "12") int limit) {
    MarketDataType t = "contract".equalsIgnoreCase(type) ? MarketDataType.CONTRACT : MarketDataType.SPOT;
    return Result.ok(agg.getHotTickers(t, limit));
  }

  @GetMapping("/summary")
  public Result<UnifiedTicker> summary(
      @RequestParam String symbol, @RequestParam(defaultValue = "spot") String type) {
    MarketDataType t = "contract".equalsIgnoreCase(type) ? MarketDataType.CONTRACT : MarketDataType.SPOT;
    return Result.ok(agg.getSummary(t, Symbols.normalizeUnified(symbol)));
  }

  @GetMapping("/kline")
  public Result<List<UnifiedKline>> kline(
      @RequestParam String symbol,
      @RequestParam(defaultValue = "spot") String type,
      @RequestParam(defaultValue = "1m") String period,
      @RequestParam(defaultValue = "500") int limit) {
    MarketDataType t = "contract".equalsIgnoreCase(type) ? MarketDataType.CONTRACT : MarketDataType.SPOT;
    return Result.ok(agg.getKlines(t, symbol, period, limit));
  }

  @GetMapping("/depth")
  public Result<UnifiedDepth> depth(
      @RequestParam String symbol,
      @RequestParam(defaultValue = "spot") String type,
      @RequestParam(defaultValue = "50") int limit) {
    MarketDataType t = "contract".equalsIgnoreCase(type) ? MarketDataType.CONTRACT : MarketDataType.SPOT;
    return Result.ok(agg.getDepth(t, symbol, limit));
  }

  @GetMapping("/trades")
  public Result<List<UnifiedTrade>> trades(
      @RequestParam String symbol,
      @RequestParam(defaultValue = "spot") String type,
      @RequestParam(defaultValue = "100") int limit) {
    MarketDataType t = "contract".equalsIgnoreCase(type) ? MarketDataType.CONTRACT : MarketDataType.SPOT;
    return Result.ok(agg.getTrades(t, symbol, limit));
  }

  private static Comparator<UnifiedTicker> comparator(String sortBy) {
    String s = sortBy != null ? sortBy.trim().toLowerCase() : "";
    return switch (s) {
      case "latestprice", "price" -> Comparator.comparing(x -> x.getLatestPrice() == null ? java.math.BigDecimal.ZERO : x.getLatestPrice());
      case "changepercent24h", "chg" -> Comparator.comparing(x -> x.getPriceChangePercent24h() == null ? java.math.BigDecimal.ZERO : x.getPriceChangePercent24h());
      case "turnover24h", "amount" -> Comparator.comparing(x -> x.getTurnover24h() == null ? java.math.BigDecimal.ZERO : x.getTurnover24h());
      case "volume24h", "vol" -> Comparator.comparing(x -> x.getVolume24h() == null ? java.math.BigDecimal.ZERO : x.getVolume24h());
      default -> Comparator.comparing(x -> x.getTurnover24h() == null ? java.math.BigDecimal.ZERO : x.getTurnover24h());
    };
  }
}

