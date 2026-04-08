package com.exchange.modules.system.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ConfigValueType {

  STRING(1),
  JSON(2),
  ;

  @EnumValue private final int code;
}
