package com.exchange.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

  /** 登录名：邮箱或手机号（当前骨架仅邮箱） */
  @NotBlank private String principal;

  @NotBlank private String password;
}
