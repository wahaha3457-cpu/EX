package com.exchange.modules.auth.service;

import com.exchange.common.exception.BusinessException;
import com.exchange.common.exception.ErrorCode;
import com.exchange.modules.auth.dto.LoginRequest;
import com.exchange.modules.auth.vo.LoginResponseVo;
import com.exchange.modules.user.vo.UserProfileVo;
import com.exchange.security.SecurityUser;
import com.exchange.security.jwt.JwtProperties;
import com.exchange.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final AuthenticationManager authenticationManager;
  private final JwtTokenProvider jwtTokenProvider;
  private final JwtProperties jwtProperties;

  public LoginResponseVo login(LoginRequest req) {
    try {
      Authentication auth =
          authenticationManager.authenticate(
              new UsernamePasswordAuthenticationToken(req.getPrincipal(), req.getPassword()));
      SecurityUser su = (SecurityUser) auth.getPrincipal();
      String token = jwtTokenProvider.createAccessToken(su.getId(), su.getUserCode());
      long expiresSec = jwtProperties.getAccessTokenTtl().getSeconds();
      UserProfileVo user =
          UserProfileVo.builder()
              .userCode(su.getUserCode())
              .nickname(null)
              .emailMasked(mask(su.getEmail()))
              .kycLevel(0)
              .build();
      return LoginResponseVo.builder()
          .accessToken(token)
          .expiresIn(expiresSec)
          .user(user)
          .build();
    } catch (BadCredentialsException ex) {
      throw new BusinessException(ErrorCode.AUTH_CREDENTIALS_INVALID);
    }
  }

  private static String mask(String email) {
    if (email == null || !email.contains("@")) {
      return "—";
    }
    return email.charAt(0) + "***" + email.substring(email.indexOf('@'));
  }
}
