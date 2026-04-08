package com.exchange.security;

import com.exchange.common.exception.BusinessException;
import com.exchange.common.exception.ErrorCode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

  private SecurityUtils() {}

  public static Long requireUserId() {
    return requireUser().getId();
  }

  public static SecurityUser requireUser() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated()) {
      throw new BusinessException(ErrorCode.AUTH_TOKEN_MISSING);
    }
    if (!(auth.getPrincipal() instanceof SecurityUser su)) {
      throw new BusinessException(ErrorCode.AUTH_FORBIDDEN);
    }
    return su;
  }
}
