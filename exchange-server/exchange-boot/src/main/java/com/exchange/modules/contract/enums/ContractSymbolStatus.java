package com.exchange.modules.contract.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ContractSymbolStatus {

  HALT(0),
  TRADING(1),
  ;

  @EnumValue private final int code;

  public static ContractSymbolStatus fromCode(int code) {
    for (ContractSymbolStatus v : values()) {
      if (v.code == code) {
        return v;
      }
    }
    throw new IllegalArgumentException("Unknown ContractSymbolStatus: " + code);
  }
}
