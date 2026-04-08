package com.exchange.modules.spot.vo;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class SpotFillVo {

  Long id;
  Long orderId;
  String pairCode;
  String side;
  /** LIMIT / MARKET */
  String orderType;
  BigDecimal price;
  BigDecimal quantity;
  BigDecimal quoteAmount;
  BigDecimal fee;
  String feeAsset;
  boolean maker;
  LocalDateTime createdAt;
}
