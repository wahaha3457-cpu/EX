package com.exchange.modules.user.service;

import com.exchange.common.exception.BusinessException;
import com.exchange.common.exception.ErrorCode;
import com.exchange.modules.user.entity.User;
import com.exchange.modules.user.mapper.UserMapper;
import com.exchange.modules.user.vo.UserProfileVo;
import com.exchange.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserQueryService {

  private final UserMapper userMapper;

  public UserProfileVo getCurrentProfile() {
    Long userId = SecurityUtils.requireUserId();
    User u =
        userMapper.selectById(userId);
    if (u == null) {
      throw new BusinessException(ErrorCode.USER_NOT_FOUND);
    }
    return UserProfileVo.builder()
        .userCode(u.getUserCode())
        .nickname(null)
        .emailMasked(maskEmail(u.getEmail()))
        .kycLevel(0)
        .build();
  }

  private static String maskEmail(String email) {
    if (email == null || !email.contains("@")) {
      return "—";
    }
    int at = email.indexOf('@');
    if (at <= 1) {
      return "***" + email.substring(at);
    }
    return email.charAt(0) + "***" + email.substring(at);
  }
}
