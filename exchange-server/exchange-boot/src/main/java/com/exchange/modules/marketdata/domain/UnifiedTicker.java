package com.exchange.modules.marketdata.domain;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UnifiedTicker {
  /** 我方统一 symbol：如 BTCUSDT */
  String symbol;
  String baseCoin;
  String quoteCoin;
  MarketDataType marketType;

  BigDecimal latestPrice;
  BigDecimal openPrice24h;
  BigDecimal high24h;
  BigDecimal low24h;
  BigDecimal volume24h;
  BigDecimal turnover24h;

  BigDecimal priceChange24h;
  BigDecimal priceChangePercent24h;

  /** 可选：排序权重或推荐权重 */
  Integer sortWeight;

  /** 数据源标识（binance/bybit/okx） */
  String provider;
  /** 源时间戳（ms） */
  Long ts;
}

