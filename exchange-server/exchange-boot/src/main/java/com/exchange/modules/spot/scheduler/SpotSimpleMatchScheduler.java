package com.exchange.modules.spot.scheduler;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.exchange.modules.marketdata.domain.MarketDataType;
import com.exchange.modules.marketdata.domain.UnifiedTicker;
import com.exchange.modules.marketdata.service.MarketDataAggregateService;
import com.exchange.modules.marketdata.util.Symbols;
import com.exchange.modules.spot.entity.SpotOrder;
import com.exchange.modules.spot.enums.SpotOrderStatus;
import com.exchange.modules.spot.enums.SpotOrderType;
import com.exchange.modules.spot.mapper.SpotOrderMapper;
import com.exchange.modules.spot.service.SpotSimpleMatchService;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 定时扫描 NEW 限价/市价单，按行情最新价尝试撮合（与前端 K 线/盘口同源数据源）。
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SpotSimpleMatchScheduler {

  private final SpotOrderMapper spotOrderMapper;
  private final SpotSimpleMatchService spotSimpleMatchService;
  private final MarketDataAggregateService marketDataAggregateService;

  @Value("${exchange.spot.match.enabled:true}")
  private boolean matchEnabled;

  @Scheduled(
      initialDelayString = "${exchange.spot.match.initial-delay-ms:8000}",
      fixedDelayString = "${exchange.spot.match.fixed-delay-ms:2500}")
  public void tick() {
    if (!matchEnabled) {
      return;
    }
    List<SpotOrder> orders =
        spotOrderMapper.selectList(
            Wrappers.<SpotOrder>lambdaQuery()
                .eq(SpotOrder::getStatus, SpotOrderStatus.NEW)
                .in(SpotOrder::getOrderType, SpotOrderType.LIMIT, SpotOrderType.MARKET)
                .orderByAsc(SpotOrder::getId)
                .last("LIMIT 200"));
    if (orders.isEmpty()) {
      return;
    }
    Map<String, BigDecimal> lastByPair = new HashMap<>();
    for (SpotOrder o : orders) {
      try {
        BigDecimal last = lastByPair.computeIfAbsent(o.getPairCode(), this::safeLastPrice);
        if (last == null) {
          continue;
        }
        if (o.getOrderType() == SpotOrderType.LIMIT) {
          spotSimpleMatchService.tryFillLimitAtLastPrice(o.getId(), last);
        } else if (o.getOrderType() == SpotOrderType.MARKET) {
          spotSimpleMatchService.tryFillMarketAtLastPrice(o.getId(), last);
        }
      } catch (Exception e) {
        log.warn(
            "[spot-match] orderId={} err={}", o.getId(), e.toString());
      }
    }
  }

  private BigDecimal safeLastPrice(String pairCode) {
    if (pairCode == null || pairCode.isBlank()) {
      return null;
    }
    try {
      String unified = Symbols.normalizeUnified(pairCode);
      UnifiedTicker t =
          marketDataAggregateService.getSummary(MarketDataType.SPOT, unified);
      if (t == null || t.getLatestPrice() == null) {
        return null;
      }
      BigDecimal px = t.getLatestPrice();
      return px.compareTo(BigDecimal.ZERO) > 0 ? px : null;
    } catch (Exception e) {
      log.debug("[spot-match] no price for pair={} : {}", pairCode, e.toString());
      return null;
    }
  }
}
