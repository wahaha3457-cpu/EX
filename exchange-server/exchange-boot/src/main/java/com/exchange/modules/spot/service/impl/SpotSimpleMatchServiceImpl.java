package com.exchange.modules.spot.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.exchange.common.exception.BusinessException;
import com.exchange.common.exception.ErrorCode;
import com.exchange.modules.market.entity.SymbolPair;
import com.exchange.modules.market.enums.MarketType;
import com.exchange.modules.market.enums.SymbolPairStatus;
import com.exchange.modules.market.mapper.SymbolPairMapper;
import com.exchange.modules.marketdata.util.Symbols;
import com.exchange.modules.spot.entity.SpotFill;
import com.exchange.modules.spot.entity.SpotOrder;
import com.exchange.modules.spot.enums.SpotOrderSide;
import com.exchange.modules.spot.enums.SpotOrderStatus;
import com.exchange.modules.spot.enums.SpotOrderType;
import com.exchange.modules.spot.mapper.SpotFillMapper;
import com.exchange.modules.spot.mapper.SpotOrderMapper;
import com.exchange.modules.spot.service.SpotBalanceService;
import com.exchange.modules.spot.service.SpotSimpleMatchService;
import com.exchange.modules.spot.support.SpotDecimalAlign;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SpotSimpleMatchServiceImpl implements SpotSimpleMatchService {

  private static final BigDecimal TAKER_FEE_RATE = new BigDecimal("0.001");

  private final SpotOrderMapper spotOrderMapper;
  private final SpotFillMapper spotFillMapper;
  private final SpotBalanceService spotBalanceService;
  private final SymbolPairMapper symbolPairMapper;

  @Override
  @Transactional(rollbackFor = Exception.class)
  public void tryFillLimitAtLastPrice(long orderId, BigDecimal lastPrice) {
    if (lastPrice == null || lastPrice.compareTo(BigDecimal.ZERO) <= 0) {
      return;
    }
    SpotOrder o =
        spotOrderMapper.selectOne(
            Wrappers.<SpotOrder>lambdaQuery()
                .eq(SpotOrder::getId, orderId)
                .eq(SpotOrder::getStatus, SpotOrderStatus.NEW)
                .eq(SpotOrder::getOrderType, SpotOrderType.LIMIT)
                .last("FOR UPDATE"));
    if (o == null) {
      return;
    }
    if (!priceCrossed(o, lastPrice)) {
      return;
    }
    BigDecimal qty = o.getQuantity();
    if (qty == null || qty.compareTo(BigDecimal.ZERO) <= 0) {
      return;
    }
    applyFullFill(o, qty, lastPrice, orderId);
  }

  @Override
  @Transactional(rollbackFor = Exception.class)
  public void tryFillMarketAtLastPrice(long orderId, BigDecimal lastPrice) {
    if (lastPrice == null || lastPrice.compareTo(BigDecimal.ZERO) <= 0) {
      return;
    }
    SpotOrder o =
        spotOrderMapper.selectOne(
            Wrappers.<SpotOrder>lambdaQuery()
                .eq(SpotOrder::getId, orderId)
                .eq(SpotOrder::getStatus, SpotOrderStatus.NEW)
                .eq(SpotOrder::getOrderType, SpotOrderType.MARKET)
                .last("FOR UPDATE"));
    if (o == null) {
      return;
    }
    SymbolPair pair = loadTradingSpotPair(o.getPairCode());
    if (pair == null) {
      log.warn("[spot-match] market skip orderId={} pair inactive or missing", orderId);
      return;
    }
    BigDecimal step = pair.getQtyStep();
    if (step == null || step.compareTo(BigDecimal.ZERO) <= 0) {
      step = new BigDecimal("0.00000001");
    }
    BigDecimal minQty = nzb(pair.getMinOrderQty());
    BigDecimal minNotional = nzb(pair.getMinNotional());

    BigDecimal execQty;
    if (o.getSide() == SpotOrderSide.BUY) {
      BigDecimal qq = o.getQuoteQty();
      if (qq == null || qq.compareTo(BigDecimal.ZERO) <= 0) {
        return;
      }
      execQty = executableMarketBuyQty(qq, lastPrice, step);
      if (execQty.compareTo(minQty) < 0) {
        return;
      }
      BigDecimal gross = lastPrice.multiply(execQty).setScale(18, RoundingMode.DOWN);
      if (gross.compareTo(minNotional) < 0) {
        return;
      }
    } else {
      BigDecimal qty = o.getQuantity();
      if (qty == null || qty.compareTo(BigDecimal.ZERO) <= 0) {
        return;
      }
      execQty = SpotDecimalAlign.alignQuantity(qty, step);
      if (execQty.compareTo(minQty) < 0) {
        return;
      }
      BigDecimal gross = lastPrice.multiply(execQty).setScale(18, RoundingMode.DOWN);
      if (gross.compareTo(minNotional) < 0) {
        return;
      }
    }

    applyFullFill(o, execQty, lastPrice, orderId);
  }

  private void applyFullFill(SpotOrder o, BigDecimal qty, BigDecimal lastPrice, long orderId) {
    String[] coins = splitPairCode(o.getPairCode());
    String baseCoin = coins[0];
    String quoteCoin = coins[1];
    if (baseCoin.isEmpty() || quoteCoin.isEmpty()) {
      log.warn("[spot-match] skip orderId={} bad pairCode={}", orderId, o.getPairCode());
      return;
    }

    BigDecimal frozenBase =
        o.getFrozenBase() != null ? o.getFrozenBase() : BigDecimal.ZERO;
    BigDecimal frozenQuote =
        o.getFrozenQuote() != null ? o.getFrozenQuote() : BigDecimal.ZERO;

    spotBalanceService.settleLimitOrderFill(
        o.getUserId(),
        baseCoin,
        quoteCoin,
        o.getSide(),
        qty,
        lastPrice,
        frozenBase,
        frozenQuote);

    BigDecimal gross = lastPrice.multiply(qty).setScale(18, RoundingMode.HALF_UP);
    BigDecimal fee = gross.multiply(TAKER_FEE_RATE).setScale(18, RoundingMode.HALF_UP);

    LocalDateTime now = LocalDateTime.now();
    SpotFill fill = new SpotFill();
    fill.setOrderId(o.getId());
    fill.setUserId(o.getUserId());
    fill.setPairCode(o.getPairCode());
    fill.setSide(o.getSide());
    fill.setOrderType(o.getOrderType());
    fill.setPrice(lastPrice);
    fill.setQuantity(qty);
    fill.setQuoteAmount(gross);
    fill.setFee(fee);
    fill.setFeeAsset(quoteCoin);
    fill.setIsMaker(0);
    fill.setCreatedAt(now);
    spotFillMapper.insert(fill);

    o.setFilledQty(qty);
    o.setAvgFillPrice(lastPrice);
    o.setFrozenBase(BigDecimal.ZERO);
    o.setFrozenQuote(BigDecimal.ZERO);
    o.setStatus(SpotOrderStatus.FILLED);
    o.setUpdatedAt(now);
    int updated = spotOrderMapper.updateById(o);
    if (updated != 1) {
      throw new BusinessException(ErrorCode.SYS_INTERNAL_ERROR, "订单状态已变更，撮合跳过");
    }
    log.info(
        "[spot-match] filled orderId={} pair={} side={} type={} qty={} last={}",
        orderId,
        o.getPairCode(),
        o.getSide(),
        o.getOrderType(),
        qty.toPlainString(),
        lastPrice.toPlainString());
  }

  /** 市价买：在手续费从报价币扣除的前提下，按步长对齐的可成交基础币数量 */
  private static BigDecimal executableMarketBuyQty(
      BigDecimal quoteBudget, BigDecimal price, BigDecimal step) {
    BigDecimal rate = BigDecimal.ONE.add(TAKER_FEE_RATE);
    BigDecimal maxGross = quoteBudget.divide(rate, 18, RoundingMode.DOWN);
    BigDecimal raw = maxGross.divide(price, 18, RoundingMode.DOWN);
    BigDecimal qty = SpotDecimalAlign.alignQuantity(raw, step);
    while (qty.compareTo(BigDecimal.ZERO) > 0) {
      BigDecimal gross = price.multiply(qty).setScale(18, RoundingMode.HALF_UP);
      BigDecimal fee = gross.multiply(TAKER_FEE_RATE).setScale(18, RoundingMode.HALF_UP);
      if (gross.add(fee).compareTo(quoteBudget) <= 0) {
        return qty;
      }
      qty = qty.subtract(step);
      if (qty.compareTo(BigDecimal.ZERO) < 0) {
        return BigDecimal.ZERO;
      }
    }
    return BigDecimal.ZERO;
  }

  private SymbolPair loadTradingSpotPair(String pairCode) {
    if (pairCode == null || pairCode.isBlank()) {
      return null;
    }
    SymbolPair pair =
        symbolPairMapper.selectOne(
            Wrappers.<SymbolPair>lambdaQuery()
                .eq(SymbolPair::getPairCode, pairCode.trim())
                .eq(SymbolPair::getMarketType, MarketType.SPOT));
    if (pair == null
        || pair.getStatus() == null
        || pair.getStatus() != SymbolPairStatus.TRADING) {
      return null;
    }
    return pair;
  }

  private static BigDecimal nzb(BigDecimal v) {
    return v != null ? v : BigDecimal.ZERO;
  }

  private static boolean priceCrossed(SpotOrder o, BigDecimal last) {
    if (o.getPrice() == null || o.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
      return false;
    }
    if (o.getSide() == SpotOrderSide.BUY) {
      return last.compareTo(o.getPrice()) <= 0;
    }
    return last.compareTo(o.getPrice()) >= 0;
  }

  private static String[] splitPairCode(String pairCode) {
    if (pairCode == null || pairCode.isBlank()) {
      return new String[] {"", ""};
    }
    String p = pairCode.trim();
    int u = p.indexOf('_');
    if (u > 0 && u < p.length() - 1) {
      return new String[] {
        p.substring(0, u).toUpperCase(), p.substring(u + 1).toUpperCase()
      };
    }
    String[] sq = Symbols.splitBaseQuote(p);
    return new String[] {sq[0].toUpperCase(), sq[1].toUpperCase()};
  }
}
