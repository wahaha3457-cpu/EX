package com.exchange.modules.contract.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.Version;
import com.exchange.modules.contract.enums.ContractMarginMode;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("contract_user_symbol_config")
public class ContractUserSymbolConfig {

  @TableId(type = IdType.AUTO)
  private Long id;

  private Long userId;
  private String symbolCode;
  private Integer leverage;
  private ContractMarginMode marginMode;

  @Version private Integer version;

  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
