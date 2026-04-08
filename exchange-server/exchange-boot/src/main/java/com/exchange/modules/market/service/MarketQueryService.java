package com.exchange.modules.market.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.exchange.modules.market.entity.SymbolPair;
import com.exchange.modules.market.enums.SymbolPairStatus;
import com.exchange.modules.market.mapper.SymbolPairMapper;
import com.exchange.modules.market.vo.SymbolPairVo;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MarketQueryService {

  private final SymbolPairMapper symbolPairMapper;

  public List<SymbolPairVo> listTradingPairs() {
    List<SymbolPair> rows =
        symbolPairMapper.selectList(
            Wrappers.<SymbolPair>lambdaQuery()
                .eq(SymbolPair::getStatus, SymbolPairStatus.TRADING)
                .orderByAsc(SymbolPair::getPairCode));
    return rows.stream()
        .map(
            s ->
                SymbolPairVo.builder()
                    .pairCode(s.getPairCode())
                    .baseCoin(s.getBaseCoin())
                    .quoteCoin(s.getQuoteCoin())
                    .marketType(s.getMarketType().name())
                    .status("TRADING")
                    .minOrderQty(s.getMinOrderQty())
                    .build())
        .toList();
  }
}
