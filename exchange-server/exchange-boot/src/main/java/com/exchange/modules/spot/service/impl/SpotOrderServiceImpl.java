package com.exchange.modules.spot.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.exchange.common.api.PageResult;
import com.exchange.common.exception.BusinessException;
import com.exchange.common.exception.ErrorCode;
import com.exchange.modules.market.entity.SymbolPair;
import com.exchange.modules.market.enums.MarketType;
import com.exchange.modules.market.mapper.SymbolPairMapper;
import com.exchange.modules.spot.domain.SpotOrderStatusFlow;
import com.exchange.modules.spot.dto.SpotCancelOrderDto;
import com.exchange.modules.spot.dto.SpotFillQuery;
import com.exchange.modules.spot.dto.SpotOrderHistoryQuery;
import com.exchange.modules.spot.dto.SpotOrderOpenQuery;
import com.exchange.modules.spot.dto.SpotPlaceOrderDto;
import com.exchange.modules.spot.entity.SpotFill;
import com.exchange.modules.spot.entity.SpotOrder;
import com.exchange.modules.spot.enums.SpotOrderSide;
import com.exchange.modules.spot.enums.SpotOrderStatus;
import com.exchange.modules.spot.enums.SpotOrderType;
import com.exchange.modules.spot.enums.SpotTimeInForce;
import com.exchange.modules.spot.mapper.SpotFillMapper;
import com.exchange.modules.spot.mapper.SpotOrderMapper;
import com.exchange.modules.spot.service.SpotBalanceService;
import com.exchange.modules.spot.service.SpotOrderService;
import com.exchange.modules.spot.support.SpotDecimalAlign;
import com.exchange.modules.spot.vo.SpotFillVo;
import com.exchange.modules.spot.vo.SpotOrderVo;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SpotOrderServiceImpl implements SpotOrderService {

  private final SpotOrderMapper spotOrderMapper;
  private final SpotFillMapper spotFillMapper;
  private final SymbolPairMapper symbolPairMapper;
  private final SpotBalanceService spotBalanceService;

  @Override
  @Transactional(rollbackFor = Exception.class)
  public SpotOrderVo placeOrder(long userId, SpotPlaceOrderDto dto) {
    String clientKey =
        dto.getClientOrderId() == null || dto.getClientOrderId().isBlank()
            ? null
            : dto.getClientOrderId().trim();
    if (clientKey != null) {
      Optional<SpotOrder> existed = findByClientOrderId(userId, clientKey);
      if (existed.isPresent()) {
        return toVo(existed.get());
      }
    }

    SymbolPair pair = loadActiveSpotPair(dto.getPairCode());
    ValidatedOrderParams params = validateAndNormalize(dto, pair);

    BigDecimal frozenBase = params.frozenBase();
    BigDecimal frozenQuote = params.frozenQuote();

    spotBalanceService.freezeSpotOrder(
        userId, pair.getBaseCoin(), pair.getQuoteCoin(), frozenBase, frozenQuote);

    SpotOrder order = new SpotOrder();
    order.setUserId(userId);
    order.setPairCode(pair.getPairCode());
    order.setClientOrderId(clientKey);
    order.setSide(params.side());
    order.setOrderType(params.orderType());
    order.setPrice(params.price());
    order.setQuantity(params.quantity());
    order.setQuoteQty(params.quoteQty());
    order.setFilledQty(BigDecimal.ZERO);
    order.setAvgFillPrice(null);
    order.setFrozenBase(frozenBase);
    order.setFrozenQuote(frozenQuote);
    order.setStatus(SpotOrderStatus.NEW);
    order.setVersion(0);
    order.setTimeInForce(dto.getTimeInForce() != null ? dto.getTimeInForce() : SpotTimeInForce.GTC);
    LocalDateTime now = LocalDateTime.now();
    order.setCreatedAt(now);
    order.setUpdatedAt(now);

    try {
      spotOrderMapper.insert(order);
    } catch (DataIntegrityViolationException ex) {
      spotBalanceService.releaseSpotOrder(
          userId, pair.getBaseCoin(), pair.getQuoteCoin(), frozenBase, frozenQuote);
      if (clientKey != null) {
        return findByClientOrderId(userId, clientKey)
            .map(this::toVo)
            .orElseThrow(
                () -> new BusinessException(ErrorCode.SPOT_DUPLICATE_CLIENT_ORDER, ex.getMessage()));
      }
      throw ex;
    }

    return toVo(order);
  }

  @Override
  @Transactional(rollbackFor = Exception.class)
  public SpotOrderVo cancelOrder(long userId, SpotCancelOrderDto dto) {
    SpotOrder order =
        spotOrderMapper.selectOne(
            Wrappers.<SpotOrder>lambdaQuery()
                .eq(SpotOrder::getId, dto.getOrderId())
                .eq(SpotOrder::getUserId, userId));
    if (order == null) {
      throw new BusinessException(ErrorCode.SPOT_ORDER_NOT_FOUND);
    }

    if (SpotOrderStatus.HISTORY_TERMINAL_SET.contains(order.getStatus())) {
      return toVo(order);
    }
    if (!SpotOrderStatusFlow.isCancellable(order.getStatus())) {
      throw new BusinessException(ErrorCode.SPOT_ORDER_INVALID_STATE, "订单不可撤销");
    }

    SymbolPair pair = loadActiveSpotPair(order.getPairCode());
    spotBalanceService.releaseSpotOrder(
        userId,
        pair.getBaseCoin(),
        pair.getQuoteCoin(),
        order.getFrozenBase(),
        order.getFrozenQuote());

    order.setStatus(SpotOrderStatus.CANCELED);
    order.setUpdatedAt(LocalDateTime.now());
    spotOrderMapper.updateById(order);

    return toVo(order);
  }

  @Override
  public PageResult<SpotOrderVo> pageOpenOrders(long userId, SpotOrderOpenQuery query) {
    Page<SpotOrder> page = new Page<>(query.getPage(), query.getPageSize());
    LambdaQueryWrapper<SpotOrder> w =
        Wrappers.<SpotOrder>lambdaQuery()
            .eq(SpotOrder::getUserId, userId)
            .in(SpotOrder::getStatus, new ArrayList<>(SpotOrderStatus.OPEN_SET))
            .orderByDesc(SpotOrder::getCreatedAt);
    if (query.getPairCode() != null && !query.getPairCode().isBlank()) {
      w.eq(SpotOrder::getPairCode, query.getPairCode().trim());
    }
    Page<SpotOrder> result = spotOrderMapper.selectPage(page, w);
    return toOrderPageResult(result);
  }

  @Override
  public PageResult<SpotOrderVo> pageHistoryOrders(long userId, SpotOrderHistoryQuery query) {
    Page<SpotOrder> page = new Page<>(query.getPage(), query.getPageSize());
    LambdaQueryWrapper<SpotOrder> w =
        Wrappers.<SpotOrder>lambdaQuery()
            .eq(SpotOrder::getUserId, userId)
            .in(SpotOrder::getStatus, new ArrayList<>(SpotOrderStatus.HISTORY_TERMINAL_SET))
            .orderByDesc(SpotOrder::getCreatedAt);
    if (query.getPairCode() != null && !query.getPairCode().isBlank()) {
      w.eq(SpotOrder::getPairCode, query.getPairCode().trim());
    }
    Page<SpotOrder> result = spotOrderMapper.selectPage(page, w);
    return toOrderPageResult(result);
  }

  @Override
  public PageResult<SpotFillVo> pageFills(long userId, SpotFillQuery query) {
    Page<SpotFill> page = new Page<>(query.getPage(), query.getPageSize());
    LambdaQueryWrapper<SpotFill> w =
        Wrappers.<SpotFill>lambdaQuery()
            .eq(SpotFill::getUserId, userId)
            .orderByDesc(SpotFill::getCreatedAt);
    if (query.getPairCode() != null && !query.getPairCode().isBlank()) {
      w.eq(SpotFill::getPairCode, query.getPairCode().trim());
    }
    Page<SpotFill> result = spotFillMapper.selectPage(page, w);
    List<SpotFillVo> list =
        result.getRecords().stream().map(this::toFillVo).collect(Collectors.toList());
    return new PageResult<>(
        list,
        result.getCurrent(),
        result.getSize(),
        result.getTotal(),
        result.hasNext());
  }

  private PageResult<SpotOrderVo> toOrderPageResult(Page<SpotOrder> result) {
    List<SpotOrderVo> list =
        result.getRecords().stream().map(this::toVo).collect(Collectors.toList());
    return new PageResult<>(
        list,
        result.getCurrent(),
        result.getSize(),
        result.getTotal(),
        result.hasNext());
  }

  private Optional<SpotOrder> findByClientOrderId(long userId, String clientOrderId) {
    return Optional.ofNullable(
        spotOrderMapper.selectOne(
            Wrappers.<SpotOrder>lambdaQuery()
                .eq(SpotOrder::getUserId, userId)
                .eq(SpotOrder::getClientOrderId, clientOrderId)));
  }

  private SymbolPair loadActiveSpotPair(String pairCode) {
    if (pairCode == null || pairCode.isBlank()) {
      throw new BusinessException(ErrorCode.SPOT_ORDER_VALIDATION, "交易对无效");
    }
    SymbolPair pair =
        symbolPairMapper.selectOne(
            Wrappers.<SymbolPair>lambdaQuery()
                .eq(SymbolPair::getPairCode, pairCode.trim())
                .eq(SymbolPair::getMarketType, MarketType.SPOT));
    if (pair == null) {
      throw new BusinessException(ErrorCode.SPOT_PAIR_NOT_FOUND);
    }
    if (pair.getStatus() == null
        || pair.getStatus() != com.exchange.modules.market.enums.SymbolPairStatus.TRADING) {
      throw new BusinessException(ErrorCode.SPOT_PAIR_DISABLED);
    }
    return pair;
  }

  /**
   * 下单前校验：类型/方向/精度/最小数量/最小成交额；市价卖单最小成交额依赖行情，主干预留仅校验最小数量。
   */
  private ValidatedOrderParams validateAndNormalize(SpotPlaceOrderDto dto, SymbolPair pair) {
    BigDecimal minQty = pair.getMinOrderQty();
    BigDecimal tick = pair.getPriceTick();
    BigDecimal step = pair.getQtyStep();
    BigDecimal minNotional = pair.getMinNotional();

    SpotOrderType type = dto.getOrderType();
    SpotOrderSide side = dto.getSide();

    if (type == SpotOrderType.LIMIT) {
      if (dto.getPrice() == null || dto.getQuantity() == null) {
        throw new BusinessException(ErrorCode.SPOT_ORDER_VALIDATION, "限价单需填写价格与数量");
      }
      BigDecimal price = SpotDecimalAlign.alignPrice(dto.getPrice(), tick);
      BigDecimal qty = SpotDecimalAlign.alignQuantity(dto.getQuantity(), step);
      if (price.compareTo(BigDecimal.ZERO) <= 0 || qty.compareTo(BigDecimal.ZERO) <= 0) {
        throw new BusinessException(ErrorCode.SPOT_ORDER_VALIDATION, "价格与数量必须为正");
      }
      if (qty.compareTo(minQty) < 0) {
        throw new BusinessException(ErrorCode.SPOT_ORDER_VALIDATION, "数量低于最小下单数量");
      }
      BigDecimal notional = price.multiply(qty).setScale(18, RoundingMode.DOWN);
      if (notional.compareTo(minNotional) < 0) {
        throw new BusinessException(ErrorCode.SPOT_ORDER_VALIDATION, "成交额低于最小名义金额");
      }
      BigDecimal fb = BigDecimal.ZERO;
      BigDecimal fq = BigDecimal.ZERO;
      if (side == SpotOrderSide.BUY) {
        fq = notional;
      } else {
        fb = qty;
      }
      return new ValidatedOrderParams(side, type, price, qty, null, fb, fq);
    }

    if (type == SpotOrderType.MARKET) {
      if (side == SpotOrderSide.BUY) {
        if (dto.getQuoteQty() == null || dto.getQuoteQty().compareTo(BigDecimal.ZERO) <= 0) {
          throw new BusinessException(ErrorCode.SPOT_ORDER_VALIDATION, "市价买入需填写 quoteQty");
        }
        BigDecimal qq = dto.getQuoteQty().setScale(18, RoundingMode.DOWN);
        if (qq.compareTo(minNotional) < 0) {
          throw new BusinessException(ErrorCode.SPOT_ORDER_VALIDATION, "成交额低于最小名义金额");
        }
        return new ValidatedOrderParams(side, type, null, BigDecimal.ZERO, qq, BigDecimal.ZERO, qq);
      }
      if (dto.getQuantity() == null) {
        throw new BusinessException(ErrorCode.SPOT_ORDER_VALIDATION, "市价卖出需填写数量");
      }
      BigDecimal qty = SpotDecimalAlign.alignQuantity(dto.getQuantity(), step);
      if (qty.compareTo(minQty) < 0) {
        throw new BusinessException(ErrorCode.SPOT_ORDER_VALIDATION, "数量低于最小下单数量");
      }
      // 最小名义成交额需参考成交价，主干由撮合侧校验或接入行情后补充
      return new ValidatedOrderParams(side, type, null, qty, null, qty, BigDecimal.ZERO);
    }

    throw new BusinessException(ErrorCode.SPOT_ORDER_VALIDATION, "不支持的订单类型");
  }

  private SpotOrderVo toVo(SpotOrder o) {
    return SpotOrderVo.builder()
        .id(o.getId())
        .pairCode(o.getPairCode())
        .clientOrderId(o.getClientOrderId())
        .side(o.getSide().name())
        .orderType(o.getOrderType().name())
        .price(o.getPrice())
        .quantity(o.getQuantity())
        .quoteQty(o.getQuoteQty())
        .filledQty(o.getFilledQty())
        .avgFillPrice(o.getAvgFillPrice())
        .status(o.getStatus().name())
        .timeInForce(o.getTimeInForce().name())
        .rejectReason(o.getRejectReason())
        .createdAt(o.getCreatedAt())
        .updatedAt(o.getUpdatedAt())
        .build();
  }

  private SpotFillVo toFillVo(SpotFill f) {
    return SpotFillVo.builder()
        .id(f.getId())
        .orderId(f.getOrderId())
        .pairCode(f.getPairCode())
        .side(f.getSide().name())
        .orderType(f.getOrderType() != null ? f.getOrderType().name() : null)
        .price(f.getPrice())
        .quantity(f.getQuantity())
        .quoteAmount(f.getQuoteAmount())
        .fee(f.getFee())
        .feeAsset(f.getFeeAsset())
        .maker(f.getIsMaker() != null && f.getIsMaker() == 1)
        .createdAt(f.getCreatedAt())
        .build();
  }

  private record ValidatedOrderParams(
      SpotOrderSide side,
      SpotOrderType orderType,
      BigDecimal price,
      BigDecimal quantity,
      BigDecimal quoteQty,
      BigDecimal frozenBase,
      BigDecimal frozenQuote) {}
}
