package com.exchange.modules.marketdata.domain;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UnifiedTrade {
  BigDecimal price;
  BigDecimal qty;
  Side side;
  long time;
  String tradeId;
  String provider;

  public enum Side {
    BUY,
    SELL
  }
}

