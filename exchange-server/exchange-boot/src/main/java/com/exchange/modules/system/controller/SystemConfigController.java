package com.exchange.modules.system.controller;

import com.exchange.common.api.Result;
import com.exchange.modules.system.service.SystemConfigQueryService;
import com.exchange.modules.system.vo.AppConfigPublicVo;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system/configs")
@RequiredArgsConstructor
public class SystemConfigController {

  private final SystemConfigQueryService systemConfigQueryService;

  @GetMapping("/{key}")
  public Result<AppConfigPublicVo> get(@PathVariable("key") String key) {
    return Result.ok(systemConfigQueryService.getPublicConfig(key));
  }
}
