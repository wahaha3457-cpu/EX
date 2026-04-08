package com.exchange.modules.market.vo;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class SymbolPairVo {

  String pairCode;
  String baseCoin;
  String quoteCoin;
  String marketType;
  String status;
  BigDecimal minOrderQty;
}
