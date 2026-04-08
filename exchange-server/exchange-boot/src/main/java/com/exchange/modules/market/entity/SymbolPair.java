package com.exchange.modules.market.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.exchange.modules.market.enums.MarketType;
import com.exchange.modules.market.enums.SymbolPairStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("symbol_pair")
public class SymbolPair {

  @TableId(type = IdType.AUTO)
  private Long id;

  private String pairCode;
  private String baseCoin;
  private String quoteCoin;
  private MarketType marketType;
  private SymbolPairStatus status;
  /** 最小下单数量（基础币），金额类统一 BigDecimal */
  private BigDecimal minOrderQty;

  /** 最小报价单位（价格精度） */
  private BigDecimal priceTick;

  /** 数量步进 */
  private BigDecimal qtyStep;

  /** 最小名义成交额（报价币，限价：price×qty；市价买单：quoteQty） */
  private BigDecimal minNotional;

  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
