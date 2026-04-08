package com.exchange.modules.market.controller;

import com.exchange.common.api.Result;
import com.exchange.modules.market.service.MarketQueryService;
import com.exchange.modules.market.vo.SymbolPairVo;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/market")
@RequiredArgsConstructor
public class MarketController {

  private final MarketQueryService marketQueryService;

  @GetMapping("/pairs")
  public Result<List<SymbolPairVo>> pairs() {
    return Result.ok(marketQueryService.listTradingPairs());
  }
}
