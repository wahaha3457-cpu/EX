package com.exchange.modules.spot.domain;

import com.exchange.modules.spot.enums.SpotOrderStatus;

/**
 * 订单状态流转说明（设计文档化，撮合接入前的主干约束）。
 *
 * <p>应用层职责：
 *
 * <ul>
 *   <li>下单成功：NEW（并冻结资金）
 *   <li>用户撤单：仅 OPEN 状态允许 → CANCELED，并解冻剩余冻结
 *   <li>拒单：入队前校验失败 → REJECTED（不产生冻结或已回滚冻结）
 * </ul>
 *
 * <p>撮合引擎职责（未来扩展）：
 *
 * <ul>
 *   <li>部分成交：NEW → PARTIALLY_FILLED，按成交回写 filledQty/avgPrice，按规则减少冻结
 *   <li>完全成交：→ FILLED，释放剩余冻结
 *   <li>IOC/FOK 未完全成交：→ CANCELED 或部分成交 + 剩余撤销（依产品）
 *   <li>过期：→ EXPIRED
 * </ul>
 *
 * <p>并发：订单行使用 {@code version} 乐观锁；撮合回写通过幂等消息 + 状态机校验避免乱序。
 */
public final class SpotOrderStatusFlow {

  private SpotOrderStatusFlow() {}

  public static boolean isCancellable(SpotOrderStatus status) {
    return status != null && status.isOpen();
  }

  public static boolean isTerminal(SpotOrderStatus status) {
    return status != null && SpotOrderStatus.HISTORY_TERMINAL_SET.contains(status);
  }
}
