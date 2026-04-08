package com.exchange.modules.system.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.exchange.modules.system.enums.ConfigValueType;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("app_config")
public class AppConfig {

  @TableId(type = IdType.AUTO)
  private Long id;

  private String configKey;
  private String configValue;
  private ConfigValueType valueType;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
