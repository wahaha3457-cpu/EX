package com.exchange.modules.auth.vo;

import com.exchange.modules.user.vo.UserProfileVo;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class LoginResponseVo {

  String accessToken;
  long expiresIn;
  UserProfileVo user;
}
