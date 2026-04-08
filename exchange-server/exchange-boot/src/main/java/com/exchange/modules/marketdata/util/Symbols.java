package com.exchange.modules.marketdata.util;

import java.util.Locale;

public final class Symbols {
  private Symbols() {}

  /**
   * 我方统一 symbol：BTCUSDT（去掉分隔符，上层应保证 base/quote 合理）
   */
  public static String normalizeUnified(String symbol) {
    if (symbol == null) return "";
    return symbol.replace("_", "").replace("-", "").trim().toUpperCase(Locale.ROOT);
  }

  public static String[] splitBaseQuote(String unifiedSymbol) {
    String s = normalizeUnified(unifiedSymbol);
    if (s.endsWith("USDT") && s.length() > 4) {
      return new String[] {s.substring(0, s.length() - 4), "USDT"};
    }
    if (s.endsWith("USD") && s.length() > 3) {
      return new String[] {s.substring(0, s.length() - 3), "USD"};
    }
    if (s.endsWith("BTC") && s.length() > 3) {
      return new String[] {s.substring(0, s.length() - 3), "BTC"};
    }
    if (s.endsWith("ETH") && s.length() > 3) {
      return new String[] {s.substring(0, s.length() - 3), "ETH"};
    }
    // 兜底：无法可靠拆分时返回整体
    return new String[] {s, ""};
  }
}

