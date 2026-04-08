package com.exchange.modules.contract.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import java.util.EnumSet;
import java.util.Set;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ContractOrderStatus {

  NEW(1),
  PARTIALLY_FILLED(2),
  FILLED(3),
  CANCELED(4),
  REJECTED(5),
  EXPIRED(6),
  ;

  @EnumValue private final int code;

  public static final Set<ContractOrderStatus> OPEN_SET = EnumSet.of(NEW, PARTIALLY_FILLED);

  public static final Set<ContractOrderStatus> HISTORY_TERMINAL_SET =
      EnumSet.of(FILLED, CANCELED, REJECTED, EXPIRED);

  public static ContractOrderStatus fromCode(int code) {
    for (ContractOrderStatus v : values()) {
      if (v.code == code) {
        return v;
      }
    }
    throw new IllegalArgumentException("Unknown ContractOrderStatus: " + code);
  }

  public boolean isOpen() {
    return OPEN_SET.contains(this);
  }
}
