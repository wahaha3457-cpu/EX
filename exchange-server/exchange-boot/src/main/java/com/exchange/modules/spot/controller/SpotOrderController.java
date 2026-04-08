package com.exchange.modules.spot.controller;

import com.exchange.common.api.PageResult;
import com.exchange.common.api.Result;
import com.exchange.modules.spot.dto.SpotCancelOrderDto;
import com.exchange.modules.spot.dto.SpotFillQuery;
import com.exchange.modules.spot.dto.SpotOrderHistoryQuery;
import com.exchange.modules.spot.dto.SpotOrderOpenQuery;
import com.exchange.modules.spot.dto.SpotPlaceOrderDto;
import com.exchange.modules.spot.service.SpotOrderService;
import com.exchange.modules.spot.vo.SpotFillVo;
import com.exchange.modules.spot.vo.SpotOrderVo;
import com.exchange.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/spot/orders")
@RequiredArgsConstructor
public class SpotOrderController {

  private final SpotOrderService spotOrderService;

  @PostMapping
  public Result<SpotOrderVo> place(@Valid @RequestBody SpotPlaceOrderDto dto) {
    return Result.ok(spotOrderService.placeOrder(SecurityUtils.requireUserId(), dto));
  }

  /** 撤单：请求体方式，便于扩展 reason、批量撤单 */
  @PostMapping("/cancel")
  public Result<SpotOrderVo> cancelByBody(@Valid @RequestBody SpotCancelOrderDto dto) {
    return Result.ok(spotOrderService.cancelOrder(SecurityUtils.requireUserId(), dto));
  }

  /** 撤单：REST 风格，幂等与 POST /cancel 一致 */
  @DeleteMapping("/{orderId}")
  public Result<SpotOrderVo> cancelByPath(@PathVariable Long orderId) {
    SpotCancelOrderDto dto = new SpotCancelOrderDto();
    dto.setOrderId(orderId);
    return Result.ok(spotOrderService.cancelOrder(SecurityUtils.requireUserId(), dto));
  }

  @GetMapping("/open")
  public Result<PageResult<SpotOrderVo>> openOrders(@Valid SpotOrderOpenQuery query) {
    return Result.ok(spotOrderService.pageOpenOrders(SecurityUtils.requireUserId(), query));
  }

  @GetMapping("/history")
  public Result<PageResult<SpotOrderVo>> historyOrders(@Valid SpotOrderHistoryQuery query) {
    return Result.ok(spotOrderService.pageHistoryOrders(SecurityUtils.requireUserId(), query));
  }

  @GetMapping("/fills")
  public Result<PageResult<SpotFillVo>> fills(@Valid SpotFillQuery query) {
    return Result.ok(spotOrderService.pageFills(SecurityUtils.requireUserId(), query));
  }
}
