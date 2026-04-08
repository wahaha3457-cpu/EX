package com.exchange.modules.contract.controller;

import com.exchange.common.api.PageResult;
import com.exchange.common.api.Result;
import com.exchange.modules.contract.dto.*;
import com.exchange.modules.contract.service.ContractTradeService;
import com.exchange.modules.contract.vo.*;
import com.exchange.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/contract")
@RequiredArgsConstructor
public class ContractTradeController {

  private final ContractTradeService contractTradeService;

  @PostMapping("/orders/open")
  public Result<ContractOrderVo> open(@Valid @RequestBody ContractOpenOrderDto dto) {
    return Result.ok(contractTradeService.openPosition(SecurityUtils.requireUserId(), dto));
  }

  @PostMapping("/orders/close")
  public Result<ContractOrderVo> close(@Valid @RequestBody ContractCloseOrderDto dto) {
    return Result.ok(contractTradeService.closePosition(SecurityUtils.requireUserId(), dto));
  }

  @PostMapping("/preferences/leverage")
  public Result<ContractLeverageVo> leverage(@Valid @RequestBody ContractLeverageDto dto) {
    return Result.ok(contractTradeService.adjustLeverage(SecurityUtils.requireUserId(), dto));
  }

  @PostMapping("/preferences/margin-mode")
  public Result<ContractMarginModeVo> marginMode(@Valid @RequestBody ContractMarginModeDto dto) {
    return Result.ok(contractTradeService.switchMarginMode(SecurityUtils.requireUserId(), dto));
  }

  @GetMapping("/positions")
  public Result<PageResult<ContractPositionVo>> positions(@Valid ContractPositionQuery query) {
    return Result.ok(contractTradeService.pagePositions(SecurityUtils.requireUserId(), query));
  }

  @GetMapping("/orders/open")
  public Result<PageResult<ContractOrderVo>> openOrders(@Valid ContractOrderOpenQuery query) {
    return Result.ok(contractTradeService.pageOpenOrders(SecurityUtils.requireUserId(), query));
  }

  @GetMapping("/orders/history")
  public Result<PageResult<ContractOrderVo>> historyOrders(@Valid ContractOrderHistoryQuery query) {
    return Result.ok(contractTradeService.pageHistoryOrders(SecurityUtils.requireUserId(), query));
  }
}
