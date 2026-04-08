package com.exchange.modules.spot.vo;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Value;

/** 现货订单对外视图（不含内部冻结明细时可裁剪） */
@Value
@Builder
public class SpotOrderVo {

  Long id;
  String pairCode;
  String clientOrderId;
  String side;
  String orderType;
  BigDecimal price;
  BigDecimal quantity;
  BigDecimal quoteQty;
  BigDecimal filledQty;
  BigDecimal avgFillPrice;
  String status;
  String timeInForce;
  String rejectReason;
  LocalDateTime createdAt;
  LocalDateTime updatedAt;
}
