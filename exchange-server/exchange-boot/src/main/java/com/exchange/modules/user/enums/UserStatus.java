package com.exchange.modules.user.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum UserStatus {

  ACTIVE(1),
  FROZEN(2),
  ;

  @EnumValue private final int code;
}
