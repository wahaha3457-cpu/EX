package com.exchange.modules.contract.support;

import com.exchange.modules.contract.enums.ContractPositionSide;
import com.exchange.modules.contract.enums.ContractTradeSide;

/** 双向持仓下买卖方向与 position_side 的组合规则（与撮合路由约定一致）。 */
public final class ContractTradeSideResolver {

  private ContractTradeSideResolver() {}

  public static ContractTradeSide openTradeSide(ContractPositionSide openDirection) {
    return openDirection == ContractPositionSide.LONG
        ? ContractTradeSide.BUY
        : ContractTradeSide.SELL;
  }

  /** 平仓：平多卖出，平空买入 */
  public static ContractTradeSide closeTradeSide(ContractPositionSide positionToClose) {
    return positionToClose == ContractPositionSide.LONG
        ? ContractTradeSide.SELL
        : ContractTradeSide.BUY;
  }
}
