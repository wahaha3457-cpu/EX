package com.exchange.modules.marketdata.service;

import com.exchange.common.exception.BusinessException;
import com.exchange.common.exception.ErrorCode;
import com.exchange.modules.marketdata.cache.MarketCacheService;
import com.exchange.modules.marketdata.domain.MarketDataType;
import com.exchange.modules.marketdata.domain.UnifiedContractSummary;
import com.exchange.modules.marketdata.domain.UnifiedDepth;
import com.exchange.modules.marketdata.domain.UnifiedKline;
import com.exchange.modules.marketdata.domain.UnifiedTicker;
import com.exchange.modules.marketdata.domain.UnifiedTrade;
import com.exchange.modules.marketdata.provider.MarketDataProvider;
import com.exchange.modules.marketdata.provider.ProviderRegistry;
import com.exchange.modules.marketdata.util.Symbols;
import com.fasterxml.jackson.core.type.TypeReference;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class MarketDataAggregateService {

  private final ProviderRegistry providerRegistry;
  private final MarketCacheService cache;

  private static final Duration TTL_TICKERS = Duration.ofSeconds(3);
  private static final Duration TTL_HOT = Duration.ofSeconds(5);
  private static final Duration TTL_KLINE = Duration.ofSeconds(10);
  private static final Duration TTL_DEPTH = Duration.ofSeconds(2);
  private static final Duration TTL_TRADES = Duration.ofSeconds(2);
  private static final Duration TTL_CONTRACT = Duration.ofSeconds(3);

  private static final Duration TTL_STALE = Duration.ofMinutes(2);

  public List<UnifiedTicker> getTickers(MarketDataType type) {
    String key = "mkt:tickers:" + type.name().toLowerCase();
    String staleKey = key + ":stale";
    Optional<List<UnifiedTicker>> hit = cache.getJson(key, new TypeReference<>() {});
    if (hit.isPresent()) return hit.get();

    List<MarketDataProvider> providers = providerRegistry.orderedProviders(type);
    Exception last = null;
    for (MarketDataProvider p : providers) {
      try {
        List<UnifiedTicker> out = p.fetchTickers(type);
        cache.setJson(key, out, TTL_TICKERS);
        cache.setJson(staleKey, out, TTL_STALE);
        return out;
      } catch (Exception e) {
        last = e;
        log.warn("[marketdata] tickers failed provider={} type={} err={}", p.name(), type, e.toString());
      }
    }
    final Exception finalLast = last;
    return cache
        .getJson(staleKey, new TypeReference<List<UnifiedTicker>>() {})
        .orElseThrow(() -> fail(finalLast));
  }

  public List<UnifiedTicker> getHotTickers(MarketDataType type, int limit) {
    String key = "mkt:tickers:hot:" + type.name().toLowerCase() + ":" + limit;
    Optional<List<UnifiedTicker>> hit = cache.getJson(key, new TypeReference<>() {});
    if (hit.isPresent()) return hit.get();
    List<UnifiedTicker> list = getTickers(type);
    List<UnifiedTicker> hot = list.stream().limit(Math.max(1, Math.min(100, limit))).toList();
    cache.setJson(key, hot, TTL_HOT);
    return hot;
  }

  public UnifiedTicker getSummary(MarketDataType type, String symbol) {
    String sym = Symbols.normalizeUnified(symbol);
    String key = "mkt:summary:" + type.name().toLowerCase() + ":" + sym;
    String staleKey = key + ":stale";
    Optional<UnifiedTicker> hit = cache.getJson(key, new TypeReference<>() {});
    if (hit.isPresent()) return hit.get();

    List<MarketDataProvider> providers = providerRegistry.orderedProviders(type);
    Exception last = null;
    for (MarketDataProvider p : providers) {
      try {
        UnifiedTicker out = p.fetchSummary(type, sym);
        cache.setJson(key, out, TTL_TICKERS);
        cache.setJson(staleKey, out, TTL_STALE);
        return out;
      } catch (Exception e) {
        last = e;
        log.warn("[marketdata] summary failed provider={} type={} symbol={} err={}", p.name(), type, sym, e.toString());
      }
    }
    final Exception finalLast = last;
    return cache
        .getJson(staleKey, new TypeReference<UnifiedTicker>() {})
        .orElseThrow(() -> fail(finalLast));
  }

  public List<UnifiedKline> getKlines(MarketDataType type, String symbol, String period, int limit) {
    String sym = Symbols.normalizeUnified(symbol);
    int lim = Math.max(1, Math.min(1500, limit));
    String key =
        "mkt:kline:" + type.name().toLowerCase() + ":" + sym + ":" + period.toLowerCase() + ":" + lim;
    String staleKey = key + ":stale";
    Optional<List<UnifiedKline>> hit = cache.getJson(key, new TypeReference<>() {});
    if (hit.isPresent()) return hit.get();

    List<MarketDataProvider> providers = providerRegistry.orderedProviders(type);
    Exception last = null;
    for (MarketDataProvider p : providers) {
      try {
        List<UnifiedKline> out = p.fetchKlines(type, sym, period, lim);
        cache.setJson(key, out, TTL_KLINE);
        cache.setJson(staleKey, out, TTL_STALE);
        return out;
      } catch (Exception e) {
        last = e;
        log.warn("[marketdata] kline failed provider={} type={} symbol={} period={} err={}", p.name(), type, sym, period, e.toString());
      }
    }
    final Exception finalLast = last;
    return cache
        .getJson(staleKey, new TypeReference<List<UnifiedKline>>() {})
        .orElseThrow(() -> fail(finalLast));
  }

  public UnifiedDepth getDepth(MarketDataType type, String symbol, int limit) {
    String sym = Symbols.normalizeUnified(symbol);
    int lim = Math.max(5, Math.min(200, limit));
    String key = "mkt:depth:" + type.name().toLowerCase() + ":" + sym + ":" + lim;
    String staleKey = key + ":stale";
    Optional<UnifiedDepth> hit = cache.getJson(key, new TypeReference<>() {});
    if (hit.isPresent()) return hit.get();

    List<MarketDataProvider> providers = providerRegistry.orderedProviders(type);
    Exception last = null;
    for (MarketDataProvider p : providers) {
      try {
        UnifiedDepth out = p.fetchDepth(type, sym, lim);
        cache.setJson(key, out, TTL_DEPTH);
        cache.setJson(staleKey, out, TTL_STALE);
        return out;
      } catch (Exception e) {
        last = e;
        log.warn("[marketdata] depth failed provider={} type={} symbol={} err={}", p.name(), type, sym, e.toString());
      }
    }
    final Exception finalLast = last;
    return cache
        .getJson(staleKey, new TypeReference<UnifiedDepth>() {})
        .orElseThrow(() -> fail(finalLast));
  }

  public List<UnifiedTrade> getTrades(MarketDataType type, String symbol, int limit) {
    String sym = Symbols.normalizeUnified(symbol);
    int lim = Math.max(1, Math.min(200, limit));
    String key = "mkt:trades:" + type.name().toLowerCase() + ":" + sym + ":" + lim;
    String staleKey = key + ":stale";
    Optional<List<UnifiedTrade>> hit = cache.getJson(key, new TypeReference<>() {});
    if (hit.isPresent()) return hit.get();

    List<MarketDataProvider> providers = providerRegistry.orderedProviders(type);
    Exception last = null;
    for (MarketDataProvider p : providers) {
      try {
        List<UnifiedTrade> out = p.fetchTrades(type, sym, lim);
        cache.setJson(key, out, TTL_TRADES);
        cache.setJson(staleKey, out, TTL_STALE);
        return out;
      } catch (Exception e) {
        last = e;
        log.warn("[marketdata] trades failed provider={} type={} symbol={} err={}", p.name(), type, sym, e.toString());
      }
    }
    final Exception finalLast = last;
    return cache
        .getJson(staleKey, new TypeReference<List<UnifiedTrade>>() {})
        .orElseThrow(() -> fail(finalLast));
  }

  public UnifiedContractSummary getContractSummary(String symbol) {
    String sym = Symbols.normalizeUnified(symbol);
    String key = "mkt:contract:summary:" + sym;
    String staleKey = key + ":stale";
    Optional<UnifiedContractSummary> hit = cache.getJson(key, new TypeReference<>() {});
    if (hit.isPresent()) return hit.get();

    List<MarketDataProvider> providers = providerRegistry.orderedProviders(MarketDataType.CONTRACT);
    Exception last = null;
    for (MarketDataProvider p : providers) {
      try {
        UnifiedContractSummary out = p.fetchContractSummary(sym);
        cache.setJson(key, out, TTL_CONTRACT);
        cache.setJson(staleKey, out, TTL_STALE);
        return out;
      } catch (Exception e) {
        last = e;
        log.warn("[marketdata] contractSummary failed provider={} symbol={} err={}", p.name(), sym, e.toString());
      }
    }
    final Exception finalLast = last;
    return cache
        .getJson(staleKey, new TypeReference<UnifiedContractSummary>() {})
        .orElseThrow(() -> fail(finalLast));
  }

  private static BusinessException fail(Exception last) {
    if (last != null) {
      return new BusinessException(ErrorCode.SYS_INTERNAL_ERROR, "行情服务暂不可用");
    }
    return new BusinessException(ErrorCode.SYS_INTERNAL_ERROR, "行情服务暂不可用");
  }
}

