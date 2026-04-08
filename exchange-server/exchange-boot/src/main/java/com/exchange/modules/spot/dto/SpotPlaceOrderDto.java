package com.exchange.modules.spot.dto;

import com.exchange.modules.spot.enums.SpotOrderSide;
import com.exchange.modules.spot.enums.SpotOrderType;
import com.exchange.modules.spot.enums.SpotTimeInForce;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.Data;

/**
 * 现货下单请求。市价买单使用 {@code quoteQty}（报价币）；市价卖单使用 {@code quantity}（基础币）。
 */
@Data
public class SpotPlaceOrderDto {

  @NotBlank(message = "交易对不能为空")
  private String pairCode;

  @NotNull(message = "买卖方向不能为空")
  private SpotOrderSide side;

  @NotNull(message = "订单类型不能为空")
  private SpotOrderType orderType;

  /** 限价：必填 */
  private BigDecimal price;

  /** 基础币数量；限价必填；市价卖单必填 */
  private BigDecimal quantity;

  /** 市价买单：报价币金额 */
  private BigDecimal quoteQty;

  /** 客户端幂等键，重试时保持不变 */
  @Size(max = 64, message = "clientOrderId 最长 64")
  private String clientOrderId;

  /** 默认 GTC；IOC/FOK 需撮合支持 */
  private SpotTimeInForce timeInForce = SpotTimeInForce.GTC;
}
