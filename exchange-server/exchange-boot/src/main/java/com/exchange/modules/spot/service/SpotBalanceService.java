package com.exchange.modules.spot.service;

import com.exchange.modules.spot.enums.SpotOrderSide;
import java.math.BigDecimal;

/**
 * 现货余额冻结/解冻（主干：DB 行级余额；未来可换为账户服务或分片钱包）。
 */
public interface SpotBalanceService {

  /** 下单冻结：从 available 转入 frozen */
  void freezeSpotOrder(
      Long userId,
      String baseCoin,
      String quoteCoin,
      BigDecimal frozenBase,
      BigDecimal frozenQuote);

  /** 撤单或拒单：从 frozen 转回 available */
  void releaseSpotOrder(
      Long userId,
      String baseCoin,
      String quoteCoin,
      BigDecimal frozenBase,
      BigDecimal frozenQuote);

  /**
   * 限价单全部成交：先解冻挂单冻结，再按成交价与吃单费率（0.1%）结算 available。
   *
   * <p>调用方须保证订单仍为 NEW 且与 frozen* 快照一致。
   */
  void settleLimitOrderFill(
      Long userId,
      String baseCoin,
      String quoteCoin,
      SpotOrderSide side,
      BigDecimal quantity,
      BigDecimal fillPrice,
      BigDecimal frozenBase,
      BigDecimal frozenQuote);
}
