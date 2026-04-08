package com.exchange.modules.system.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.exchange.common.exception.BusinessException;
import com.exchange.common.exception.ErrorCode;
import com.exchange.modules.system.entity.AppConfig;
import com.exchange.modules.system.mapper.AppConfigMapper;
import com.exchange.modules.system.vo.AppConfigPublicVo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SystemConfigQueryService {

  private final AppConfigMapper appConfigMapper;

  public AppConfigPublicVo getPublicConfig(String key) {
    AppConfig row =
        appConfigMapper.selectOne(
            Wrappers.<AppConfig>lambdaQuery().eq(AppConfig::getConfigKey, key).last("LIMIT 1"));
    if (row == null) {
      throw new BusinessException(ErrorCode.SYS_PARAM_INVALID, "配置不存在");
    }
    return AppConfigPublicVo.builder()
        .key(row.getConfigKey())
        .value(row.getConfigValue())
        .valueType(row.getValueType().name())
        .build();
  }
}
