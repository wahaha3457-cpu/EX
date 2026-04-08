package com.exchange.modules.contract.vo;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ContractOrderVo {

  Long id;
  String symbolCode;
  String clientOrderId;
  String positionSide;
  String positionEffect;
  String tradeSide;
  String orderType;
  BigDecimal price;
  BigDecimal quantity;
  BigDecimal quoteQty;
  BigDecimal filledQty;
  BigDecimal avgFillPrice;
  boolean reduceOnly;
  BigDecimal frozenMargin;
  int leverageSnapshot;
  String marginModeSnapshot;
  BigDecimal takeProfitPrice;
  BigDecimal stopLossPrice;
  BigDecimal conditionalTriggerPrice;
  String status;
  String timeInForce;
  String rejectReason;
  LocalDateTime createdAt;
  LocalDateTime updatedAt;
}
