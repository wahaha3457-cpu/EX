package com.exchange.modules.market.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MarketType {

  SPOT(1),
  CONTRACT(2),
  ;

  @EnumValue private final int code;
}
