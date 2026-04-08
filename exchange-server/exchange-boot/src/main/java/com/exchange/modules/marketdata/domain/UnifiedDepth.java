package com.exchange.modules.marketdata.domain;

import java.math.BigDecimal;
import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UnifiedDepth {
  String symbol;
  MarketDataType marketType;
  long timestamp;
  List<Level> bids;
  List<Level> asks;
  String provider;

  @Value
  @Builder
  public static class Level {
    BigDecimal price;
    BigDecimal amount;
  }
}

