package com.exchange.modules.spot.service;

import java.math.BigDecimal;

/**
 * 简易现货撮合：NEW 限价单在行情穿越委托价时成交；NEW 市价单按最新价成交（开发/演示用，非生产级撮合引擎）。
 */
public interface SpotSimpleMatchService {

  /**
   * 若订单仍为 NEW 限价且 {@code lastPrice} 已穿越委托价，则成交并写成交明细（spot_fill）。
   *
   * @param lastPrice 外部行情最新价（与 /market/summary 同源）
   */
  void tryFillLimitAtLastPrice(long orderId, BigDecimal lastPrice);

  /**
   * 若订单仍为 NEW 市价，则按 {@code lastPrice} 计算成交量并全额成交，写入 spot_fill。
   */
  void tryFillMarketAtLastPrice(long orderId, BigDecimal lastPrice);
}
