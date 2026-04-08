package com.exchange.modules.user.vo;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserProfileVo {

  String userCode;
  String nickname;
  String emailMasked;
  Integer kycLevel;
}
