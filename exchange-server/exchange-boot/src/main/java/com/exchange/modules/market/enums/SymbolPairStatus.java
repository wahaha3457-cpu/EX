package com.exchange.modules.market.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SymbolPairStatus {

  TRADING(1),
  HALT(0),
  ;

  @EnumValue private final int code;
}
