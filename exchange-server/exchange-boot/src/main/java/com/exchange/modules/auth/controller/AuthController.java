package com.exchange.modules.auth.controller;

import com.exchange.common.api.Result;
import com.exchange.modules.auth.dto.LoginRequest;
import com.exchange.modules.auth.service.AuthService;
import com.exchange.modules.auth.vo.LoginResponseVo;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  @PostMapping("/login")
  public Result<LoginResponseVo> login(@Valid @RequestBody LoginRequest request) {
    return Result.ok(authService.login(request));
  }
}
