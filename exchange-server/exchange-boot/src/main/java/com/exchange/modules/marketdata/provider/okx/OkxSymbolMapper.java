package com.exchange.modules.marketdata.provider.okx;

import com.exchange.modules.marketdata.domain.MarketDataType;
import com.exchange.modules.marketdata.util.Symbols;

public final class OkxSymbolMapper {
  private OkxSymbolMapper() {}

  /** 我方 BTCUSDT → OKX instId */
  public static String toInstId(MarketDataType type, String unifiedSymbol) {
    String sym = Symbols.normalizeUnified(unifiedSymbol);
    String[] pq = Symbols.splitBaseQuote(sym);
    String base = pq[0];
    String quote = pq[1].isBlank() ? "USDT" : pq[1];
    if (type == MarketDataType.CONTRACT) {
      return base + "-" + quote + "-SWAP";
    }
    return base + "-" + quote;
  }

  /** OKX index tickers 使用 BTC-USDT */
  public static String toIndexId(String unifiedSymbol) {
    String sym = Symbols.normalizeUnified(unifiedSymbol);
    String[] pq = Symbols.splitBaseQuote(sym);
    String base = pq[0];
    String quote = pq[1].isBlank() ? "USDT" : pq[1];
    return base + "-" + quote;
  }

  /** OKX instId → 我方 BTCUSDT */
  public static String toUnifiedSymbol(MarketDataType type, String instId) {
    if (instId == null) return "";
    String s = instId.trim().toUpperCase();
    if (type == MarketDataType.CONTRACT && s.endsWith("-SWAP")) {
      s = s.substring(0, s.length() - "-SWAP".length());
    }
    return s.replace("-", "");
  }
}

