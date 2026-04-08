package com.exchange.modules.contract.support;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class ContractDecimalAlign {

  private ContractDecimalAlign() {}

  public static BigDecimal alignDown(BigDecimal value, BigDecimal step) {
    if (value == null || step == null || step.compareTo(BigDecimal.ZERO) <= 0) {
      return value;
    }
    BigDecimal n = value.divide(step, 0, RoundingMode.DOWN);
    return n.multiply(step).stripTrailingZeros();
  }
}
