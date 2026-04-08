package com.exchange.modules.contract.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.exchange.modules.contract.enums.ContractSymbolStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("contract_symbol")
public class ContractSymbol {

  @TableId(type = IdType.AUTO)
  private Long id;

  private String symbolCode;
  private String baseCoin;
  private String quoteCoin;
  private BigDecimal contractSize;
  private Integer maxLeverage;
  private BigDecimal maintenanceMarginRate;
  private BigDecimal priceTick;
  private BigDecimal qtyStep;
  private BigDecimal minOrderQty;
  private BigDecimal minNotional;
  private BigDecimal markPrice;
  private ContractSymbolStatus status;

  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
