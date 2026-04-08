package com.exchange.modules.marketdata.web;

import com.exchange.common.api.Result;
import com.exchange.modules.marketdata.domain.UnifiedContractSummary;
import com.exchange.modules.marketdata.service.MarketDataAggregateService;
import com.exchange.modules.marketdata.util.Symbols;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contract")
@RequiredArgsConstructor
public class ContractApiController {

  private final MarketDataAggregateService agg;

  @GetMapping("/summary")
  public Result<UnifiedContractSummary> summary(@RequestParam String symbol) {
    return Result.ok(agg.getContractSummary(Symbols.normalizeUnified(symbol)));
  }

  @GetMapping("/funding-rate")
  public Result<Object> fundingRate(@RequestParam String symbol) {
    UnifiedContractSummary s = agg.getContractSummary(Symbols.normalizeUnified(symbol));
    return Result.ok(
        java.util.Map.of(
            "symbol",
            s.getSymbol(),
            "fundingRate",
            s.getFundingRate(),
            "nextFundingTime",
            s.getNextFundingTime(),
            "provider",
            s.getProvider(),
            "ts",
            s.getTs()));
  }

  @GetMapping("/open-interest")
  public Result<Object> openInterest(@RequestParam String symbol) {
    UnifiedContractSummary s = agg.getContractSummary(Symbols.normalizeUnified(symbol));
    return Result.ok(
        java.util.Map.of(
            "symbol", s.getSymbol(), "openInterest", s.getOpenInterest(), "provider", s.getProvider(), "ts", s.getTs()));
  }
}

