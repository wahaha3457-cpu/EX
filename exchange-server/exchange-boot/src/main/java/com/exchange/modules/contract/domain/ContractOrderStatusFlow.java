package com.exchange.modules.contract.domain;

import com.exchange.modules.contract.enums.ContractOrderStatus;

/**
 * 合约委托状态流转（与现货类似，增加撮合/清算/保险基金等扩展点）。
 *
 * <ul>
 *   <li>NEW：已校验保证金并冻结，等待撮合队列
 *   <li>PARTIALLY_FILLED / FILLED：由撮合回写；成交导致持仓与盈亏变化
 *   <li>CANCELED：用户撤单或系统撤单（释放 frozen_margin）
 *   <li>REJECTED：风控/参数失败
 *   <li>EXPIRED：TTL 或条件单过期（预留）
 * </ul>
 *
 * <p>止盈止损、条件单：可在 NEW 前写入触发价字段，由策略引擎或撮合前置模块处理。
 */
public final class ContractOrderStatusFlow {

  private ContractOrderStatusFlow() {}

  public static boolean isCancellable(ContractOrderStatus status) {
    return status != null && status.isOpen();
  }

  public static boolean isTerminal(ContractOrderStatus status) {
    return status != null && ContractOrderStatus.HISTORY_TERMINAL_SET.contains(status);
  }
}
