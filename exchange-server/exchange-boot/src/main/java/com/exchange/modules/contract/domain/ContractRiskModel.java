package com.exchange.modules.contract.domain;

import java.math.BigDecimal;

/**
 * 风险率 / 强平 预留。
 *
 * <p>常见定义：marginRatio = (MM + 费用调整) / (权益) ，权益 = 钱包余额 + 未实现盈亏（全仓需聚合多合约）。
 *
 * <p>强平价：由标记价格、持仓、杠杆、MMR、手续费率等联合求解，应在独立风控服务或定时任务中计算并回写
 * {@code contract_position.liquidation_price} 与 {@code risk_rate}。
 *
 * <p>主干仅保留字段与注释，避免在本层实现简化错误公式。
 */
public final class ContractRiskModel {

  private ContractRiskModel() {}

  /** 占位：后续接入真实权益与维持保证金 */
  public static BigDecimal placeholderRiskRate() {
    return null;
  }
}
