package com.exchange.modules.system.vo;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AppConfigPublicVo {

  String key;
  String value;
  String valueType;
}
