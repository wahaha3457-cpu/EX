package com.exchange.modules.marketdata.provider;

import com.exchange.modules.marketdata.domain.MarketDataType;
import com.exchange.modules.marketdata.domain.UnifiedContractSummary;
import com.exchange.modules.marketdata.domain.UnifiedDepth;
import com.exchange.modules.marketdata.domain.UnifiedKline;
import com.exchange.modules.marketdata.domain.UnifiedTicker;
import com.exchange.modules.marketdata.domain.UnifiedTrade;
import java.util.List;

/**
 * 统一行情数据源适配接口。
 *
 * <p>业务层只依赖 Unified* 模型，不直接依赖第三方字段。
 */
public interface MarketDataProvider {

  /** 数据源名：binance/bybit/okx */
  String name();

  /** 越小优先级越高 */
  int priority();

  /** 是否支持该市场类型 */
  boolean supports(MarketDataType type);

  /** 全市场 ticker 列表（建议返回该源可用的主流列表） */
  List<UnifiedTicker> fetchTickers(MarketDataType type) throws Exception;

  /** 单市场摘要：可用 tickers 过滤实现或单独调用 */
  UnifiedTicker fetchSummary(MarketDataType type, String symbol) throws Exception;

  List<UnifiedKline> fetchKlines(MarketDataType type, String symbol, String period, int limit)
      throws Exception;

  UnifiedDepth fetchDepth(MarketDataType type, String symbol, int limit) throws Exception;

  List<UnifiedTrade> fetchTrades(MarketDataType type, String symbol, int limit) throws Exception;

  /** 合约扩展行情（仅 CONTRACT 需要） */
  UnifiedContractSummary fetchContractSummary(String symbol) throws Exception;
}

