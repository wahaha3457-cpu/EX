package com.exchange.modules.marketdata.provider.binance;

public final class BinancePeriodMapper {
  private BinancePeriodMapper() {}

  public static String toInterval(String period) {
    String p = period == null ? "" : period.trim().toLowerCase();
    return switch (p) {
      case "1m" -> "1m";
      case "5m" -> "5m";
      case "15m" -> "15m";
      case "30m" -> "30m";
      case "1h" -> "1h";
      case "4h" -> "4h";
      case "1d" -> "1d";
      case "1w" -> "1w";
      default -> "1m";
    };
  }
}

