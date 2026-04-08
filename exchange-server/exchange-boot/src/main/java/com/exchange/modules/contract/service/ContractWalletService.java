package com.exchange.modules.contract.service;

import java.math.BigDecimal;

/** 合约钱包 USDT 保证金冻结/释放（与挂单 frozen_margin 对应）。 */
public interface ContractWalletService {

  void freezeMargin(Long userId, BigDecimal amountUsdt);

  void releaseMargin(Long userId, BigDecimal amountUsdt);
}
