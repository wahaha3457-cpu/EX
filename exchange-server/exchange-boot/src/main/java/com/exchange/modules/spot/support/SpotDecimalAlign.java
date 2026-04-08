package com.exchange.modules.spot.support;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** 价格/数量按交易对步进对齐（向下取整，与主流交易所「步长」一致）。 */
public final class SpotDecimalAlign {

  private SpotDecimalAlign() {}

  public static BigDecimal alignDown(BigDecimal value, BigDecimal step) {
    if (value == null || step == null || step.compareTo(BigDecimal.ZERO) <= 0) {
      return value;
    }
    BigDecimal n = value.divide(step, 0, RoundingMode.DOWN);
    return n.multiply(step).stripTrailingZeros();
  }

  /** 价格：按 tick 对齐 */
  public static BigDecimal alignPrice(BigDecimal price, BigDecimal priceTick) {
    return alignDown(price, priceTick);
  }

  /** 数量：按 qtyStep 对齐 */
  public static BigDecimal alignQuantity(BigDecimal qty, BigDecimal qtyStep) {
    return alignDown(qty, qtyStep);
  }
}
