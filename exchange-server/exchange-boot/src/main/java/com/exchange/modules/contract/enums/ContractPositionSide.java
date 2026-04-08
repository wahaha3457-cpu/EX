package com.exchange.modules.contract.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ContractPositionSide {

  LONG(1),
  SHORT(2),
  ;

  @EnumValue private final int code;

  public static ContractPositionSide fromCode(int code) {
    for (ContractPositionSide v : values()) {
      if (v.code == code) {
        return v;
      }
    }
    throw new IllegalArgumentException("Unknown ContractPositionSide: " + code);
  }
}
