package com.exchange.modules.contract.vo;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ContractPositionVo {

  Long id;
  String symbolCode;
  String positionSide;
  BigDecimal contracts;
  BigDecimal entryPrice;
  int leverage;
  String marginMode;
  BigDecimal isolatedMargin;
  BigDecimal unrealizedPnl;
  BigDecimal liquidationPrice;
  BigDecimal riskRate;
  LocalDateTime createdAt;
  LocalDateTime updatedAt;
}
