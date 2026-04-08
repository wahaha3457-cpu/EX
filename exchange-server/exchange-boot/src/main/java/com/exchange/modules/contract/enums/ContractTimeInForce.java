package com.exchange.modules.contract.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ContractTimeInForce {

  GTC(1),
  IOC(2),
  FOK(3),
  ;

  @EnumValue private final int code;

  public static ContractTimeInForce fromCode(int code) {
    for (ContractTimeInForce v : values()) {
      if (v.code == code) {
        return v;
      }
    }
    throw new IllegalArgumentException("Unknown ContractTimeInForce: " + code);
  }
}
