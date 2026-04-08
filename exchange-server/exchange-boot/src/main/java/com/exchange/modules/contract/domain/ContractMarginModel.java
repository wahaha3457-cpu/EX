package com.exchange.modules.contract.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 线性 U 本位：名义价值(USDT) = 张数 × 合约面值(基础币/张) × 价格。
 *
 * <p>初始保证金 IM = 名义 / 杠杆。维持保证金 MM = 名义 × MMR（用于风险率与强平，由风控引擎精算）。
 *
 * <p>全仓：IM 从合约钱包可用划入冻结；逐仓：IM 划入持仓 isolated_margin（主干可与 frozen 同步扩展）。
 */
public final class ContractMarginModel {

  private ContractMarginModel() {}

  public static BigDecimal notionalUsd(
      BigDecimal contracts, BigDecimal contractSize, BigDecimal markOrOrderPrice) {
    return contracts
        .multiply(contractSize)
        .multiply(markOrOrderPrice)
        .setScale(18, RoundingMode.DOWN);
  }

  public static BigDecimal initialMargin(BigDecimal notionalUsd, int leverage) {
    if (leverage <= 0) {
      throw new IllegalArgumentException("leverage");
    }
    return notionalUsd.divide(BigDecimal.valueOf(leverage), 18, RoundingMode.UP);
  }

  /** 维持保证金（占位）：名义 × 维持保证金率 */
  public static BigDecimal maintenanceMargin(
      BigDecimal notionalUsd, BigDecimal maintenanceMarginRate) {
    return notionalUsd.multiply(maintenanceMarginRate).setScale(18, RoundingMode.UP);
  }
}
