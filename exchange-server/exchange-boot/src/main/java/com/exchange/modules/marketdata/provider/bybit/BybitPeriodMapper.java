package com.exchange.modules.marketdata.provider.bybit;

public final class BybitPeriodMapper {
  private BybitPeriodMapper() {}

  public static String toInterval(String period) {
    String p = period == null ? "" : period.trim().toLowerCase();
    return switch (p) {
      case "1m" -> "1";
      case "5m" -> "5";
      case "15m" -> "15";
      case "30m" -> "30";
      case "1h" -> "60";
      case "4h" -> "240";
      case "1d" -> "D";
      case "1w" -> "W";
      default -> "1";
    };
  }
}

