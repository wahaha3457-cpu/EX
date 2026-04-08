package com.exchange.modules.marketdata.provider.okx;

public final class OkxPeriodMapper {
  private OkxPeriodMapper() {}

  public static String toBar(String period) {
    String p = period == null ? "" : period.trim().toLowerCase();
    return switch (p) {
      case "1m" -> "1m";
      case "5m" -> "5m";
      case "15m" -> "15m";
      case "30m" -> "30m";
      case "1h" -> "1H";
      case "4h" -> "4H";
      case "1d" -> "1D";
      case "1w" -> "1W";
      default -> "1m";
    };
  }
}

