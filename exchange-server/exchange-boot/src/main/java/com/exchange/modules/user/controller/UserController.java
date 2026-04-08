package com.exchange.modules.user.controller;

import com.exchange.common.api.Result;
import com.exchange.modules.user.service.UserQueryService;
import com.exchange.modules.user.vo.UserProfileVo;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

  private final UserQueryService userQueryService;

  @GetMapping("/me")
  public Result<UserProfileVo> me() {
    return Result.ok(userQueryService.getCurrentProfile());
  }
}
