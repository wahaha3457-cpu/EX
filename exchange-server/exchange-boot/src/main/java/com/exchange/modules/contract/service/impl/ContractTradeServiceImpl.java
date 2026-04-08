package com.exchange.modules.contract.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.exchange.common.api.PageResult;
import com.exchange.common.exception.BusinessException;
import com.exchange.common.exception.ErrorCode;
import com.exchange.modules.contract.domain.ContractMarginModel;
import com.exchange.modules.contract.dto.*;
import com.exchange.modules.contract.entity.*;
import com.exchange.modules.contract.enums.*;
import com.exchange.modules.contract.mapper.*;
import com.exchange.modules.contract.service.ContractTradeService;
import com.exchange.modules.contract.service.ContractWalletService;
import com.exchange.modules.contract.support.ContractDecimalAlign;
import com.exchange.modules.contract.support.ContractTradeSideResolver;
import com.exchange.modules.contract.vo.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ContractTradeServiceImpl implements ContractTradeService {

  private final ContractSymbolMapper contractSymbolMapper;
  private final ContractOrderMapper contractOrderMapper;
  private final ContractPositionMapper contractPositionMapper;
  private final ContractUserSymbolConfigMapper contractUserSymbolConfigMapper;
  private final ContractWalletService contractWalletService;

  @Override
  @Transactional(rollbackFor = Exception.class)
  public ContractOrderVo openPosition(long userId, ContractOpenOrderDto dto) {
    String clientKey = normalizeClientKey(dto.getClientOrderId());
    if (clientKey != null) {
      Optional<ContractOrder> existed = findByClientOrderId(userId, clientKey);
      if (existed.isPresent()) {
        return toOrderVo(existed.get());
      }
    }

    if (dto.getOrderType() == ContractOrderType.CONDITIONAL) {
      throw new BusinessException(
          ErrorCode.CONTRACT_VALIDATION, "条件单尚未接入，请使用限价/市价");
    }

    ContractSymbol sym = loadTradingSymbol(dto.getSymbolCode().trim());
    ContractUserSymbolConfig pref = loadOrCreateConfig(userId, sym);

    int leverage = effectiveLeverage(dto.getLeverage(), pref, sym);
    ContractMarginMode marginMode = dto.getMarginMode() != null ? dto.getMarginMode() : pref.getMarginMode();

    BigDecimal qty =
        ContractDecimalAlign.alignDown(dto.getQuantity(), sym.getQtyStep());
    if (qty.compareTo(sym.getMinOrderQty()) < 0) {
      throw new BusinessException(ErrorCode.CONTRACT_VALIDATION, "张数低于最小下单量");
    }

    BigDecimal refPrice;
    if (dto.getOrderType() == ContractOrderType.LIMIT) {
      if (dto.getPrice() == null || dto.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
        throw new BusinessException(ErrorCode.CONTRACT_VALIDATION, "限价单价格无效");
      }
      refPrice = ContractDecimalAlign.alignDown(dto.getPrice(), sym.getPriceTick());
    } else {
      refPrice = sym.getMarkPrice();
    }

    BigDecimal notional =
        ContractMarginModel.notionalUsd(qty, sym.getContractSize(), refPrice);
    if (notional.compareTo(sym.getMinNotional()) < 0) {
      throw new BusinessException(ErrorCode.CONTRACT_VALIDATION, "名义金额低于最小要求");
    }

    BigDecimal im = ContractMarginModel.initialMargin(notional, leverage);

    ContractPositionSide openSide = dto.getOpenSide();
    ContractTradeSide tradeSide = ContractTradeSideResolver.openTradeSide(openSide);

    contractWalletService.freezeMargin(userId, im);

    ContractOrder order = new ContractOrder();
    order.setUserId(userId);
    order.setSymbolCode(sym.getSymbolCode());
    order.setClientOrderId(clientKey);
    order.setPositionSide(openSide);
    order.setPositionEffect(ContractPositionEffect.OPEN);
    order.setTradeSide(tradeSide);
    order.setOrderType(dto.getOrderType());
    order.setPrice(dto.getOrderType() == ContractOrderType.LIMIT ? refPrice : null);
    order.setQuantity(qty);
    order.setQuoteQty(null);
    order.setFilledQty(BigDecimal.ZERO);
    order.setAvgFillPrice(null);
    order.setReduceOnly(0);
    order.setFrozenMargin(im);
    order.setLeverageSnapshot(leverage);
    order.setMarginModeSnapshot(marginMode);
    order.setTakeProfitPrice(dto.getTakeProfitPrice());
    order.setStopLossPrice(dto.getStopLossPrice());
    order.setConditionalTriggerPrice(null);
    order.setStatus(ContractOrderStatus.NEW);
    order.setTimeInForce(
        dto.getTimeInForce() != null ? dto.getTimeInForce() : ContractTimeInForce.GTC);
    order.setVersion(0);
    LocalDateTime now = LocalDateTime.now();
    order.setCreatedAt(now);
    order.setUpdatedAt(now);

    try {
      contractOrderMapper.insert(order);
    } catch (DataIntegrityViolationException ex) {
      contractWalletService.releaseMargin(userId, im);
      if (clientKey != null) {
        return findByClientOrderId(userId, clientKey)
            .map(this::toOrderVo)
            .orElseThrow(
                () ->
                    new BusinessException(
                        ErrorCode.CONTRACT_DUPLICATE_CLIENT_ORDER, ex.getMessage()));
      }
      throw ex;
    }

    syncUserPreference(userId, sym, leverage, marginMode);
    return toOrderVo(order);
  }

  @Override
  @Transactional(rollbackFor = Exception.class)
  public ContractOrderVo closePosition(long userId, ContractCloseOrderDto dto) {
    String clientKey = normalizeClientKey(dto.getClientOrderId());
    if (clientKey != null) {
      Optional<ContractOrder> existed = findByClientOrderId(userId, clientKey);
      if (existed.isPresent()) {
        return toOrderVo(existed.get());
      }
    }

    ContractSymbol sym = loadTradingSymbol(dto.getSymbolCode().trim());
    ContractPosition pos =
        contractPositionMapper.selectOne(
            Wrappers.<ContractPosition>lambdaQuery()
                .eq(ContractPosition::getUserId, userId)
                .eq(ContractPosition::getSymbolCode, sym.getSymbolCode())
                .eq(ContractPosition::getPositionSide, dto.getPositionSide()));
    if (pos == null || pos.getContracts().compareTo(BigDecimal.ZERO) <= 0) {
      throw new BusinessException(ErrorCode.CONTRACT_POSITION_NOT_FOUND);
    }

    BigDecimal qty =
        ContractDecimalAlign.alignDown(dto.getQuantity(), sym.getQtyStep());
    if (qty.compareTo(BigDecimal.ZERO) <= 0 || qty.compareTo(pos.getContracts()) > 0) {
      throw new BusinessException(ErrorCode.CONTRACT_POSITION_QTY_EXCEEDED);
    }

    BigDecimal refPrice;
    if (dto.getOrderType() == ContractOrderType.LIMIT) {
      if (dto.getPrice() == null || dto.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
        throw new BusinessException(ErrorCode.CONTRACT_VALIDATION, "限价平仓价格无效");
      }
      refPrice = ContractDecimalAlign.alignDown(dto.getPrice(), sym.getPriceTick());
    } else {
      refPrice = sym.getMarkPrice();
    }

    BigDecimal notional =
        ContractMarginModel.notionalUsd(qty, sym.getContractSize(), refPrice);
    if (notional.compareTo(sym.getMinNotional()) < 0) {
      throw new BusinessException(ErrorCode.CONTRACT_VALIDATION, "名义金额低于最小要求");
    }

    ContractTradeSide tradeSide = ContractTradeSideResolver.closeTradeSide(dto.getPositionSide());

    ContractOrder order = new ContractOrder();
    order.setUserId(userId);
    order.setSymbolCode(sym.getSymbolCode());
    order.setClientOrderId(clientKey);
    order.setPositionSide(dto.getPositionSide());
    order.setPositionEffect(ContractPositionEffect.CLOSE);
    order.setTradeSide(tradeSide);
    order.setOrderType(dto.getOrderType());
    order.setPrice(dto.getOrderType() == ContractOrderType.LIMIT ? refPrice : null);
    order.setQuantity(qty);
    order.setQuoteQty(null);
    order.setFilledQty(BigDecimal.ZERO);
    order.setAvgFillPrice(null);
    order.setReduceOnly(1);
    order.setFrozenMargin(BigDecimal.ZERO);
    order.setLeverageSnapshot(pos.getLeverage());
    order.setMarginModeSnapshot(pos.getMarginMode());
    order.setTakeProfitPrice(null);
    order.setStopLossPrice(null);
    order.setConditionalTriggerPrice(null);
    order.setStatus(ContractOrderStatus.NEW);
    order.setTimeInForce(ContractTimeInForce.GTC);
    order.setVersion(0);
    LocalDateTime now = LocalDateTime.now();
    order.setCreatedAt(now);
    order.setUpdatedAt(now);

    try {
      contractOrderMapper.insert(order);
    } catch (DataIntegrityViolationException ex) {
      if (clientKey != null) {
        return findByClientOrderId(userId, clientKey)
            .map(this::toOrderVo)
            .orElseThrow(
                () ->
                    new BusinessException(
                        ErrorCode.CONTRACT_DUPLICATE_CLIENT_ORDER, ex.getMessage()));
      }
      throw ex;
    }

    return toOrderVo(order);
  }

  @Override
  @Transactional(rollbackFor = Exception.class)
  public ContractLeverageVo adjustLeverage(long userId, ContractLeverageDto dto) {
    ContractSymbol sym = loadTradingSymbol(dto.getSymbolCode().trim());
    int lev = dto.getLeverage();
    if (lev < 1 || lev > sym.getMaxLeverage()) {
      throw new BusinessException(ErrorCode.CONTRACT_LEVERAGE_INVALID);
    }
    ContractUserSymbolConfig cfg = loadOrCreateConfig(userId, sym);
    cfg.setLeverage(lev);
    cfg.setUpdatedAt(LocalDateTime.now());
    contractUserSymbolConfigMapper.updateById(cfg);

    contractPositionMapper.update(
        null,
        Wrappers.<ContractPosition>lambdaUpdate()
            .set(ContractPosition::getLeverage, lev)
            .set(ContractPosition::getUpdatedAt, LocalDateTime.now())
            .eq(ContractPosition::getUserId, userId)
            .eq(ContractPosition::getSymbolCode, sym.getSymbolCode())
            .gt(ContractPosition::getContracts, BigDecimal.ZERO));

    return ContractLeverageVo.builder()
        .symbolCode(sym.getSymbolCode())
        .leverage(lev)
        .maxLeverage(sym.getMaxLeverage())
        .build();
  }

  @Override
  @Transactional(rollbackFor = Exception.class)
  public ContractMarginModeVo switchMarginMode(long userId, ContractMarginModeDto dto) {
    ContractSymbol sym = loadTradingSymbol(dto.getSymbolCode().trim());
    long openPositions =
        contractPositionMapper.selectCount(
            Wrappers.<ContractPosition>lambdaQuery()
                .eq(ContractPosition::getUserId, userId)
                .eq(ContractPosition::getSymbolCode, sym.getSymbolCode())
                .gt(ContractPosition::getContracts, BigDecimal.ZERO));
    if (openPositions > 0) {
      throw new BusinessException(ErrorCode.CONTRACT_MARGIN_MODE_SWITCH_DENIED);
    }
    ContractUserSymbolConfig cfg = loadOrCreateConfig(userId, sym);
    cfg.setMarginMode(dto.getMarginMode());
    cfg.setUpdatedAt(LocalDateTime.now());
    contractUserSymbolConfigMapper.updateById(cfg);

    return ContractMarginModeVo.builder()
        .symbolCode(sym.getSymbolCode())
        .marginMode(dto.getMarginMode().name())
        .build();
  }

  @Override
  public PageResult<ContractPositionVo> pagePositions(long userId, ContractPositionQuery query) {
    Page<ContractPosition> page = new Page<>(query.getPage(), query.getPageSize());
    LambdaQueryWrapper<ContractPosition> w =
        Wrappers.<ContractPosition>lambdaQuery()
            .eq(ContractPosition::getUserId, userId)
            .gt(ContractPosition::getContracts, BigDecimal.ZERO)
            .orderByDesc(ContractPosition::getUpdatedAt);
    if (query.getSymbolCode() != null && !query.getSymbolCode().isBlank()) {
      w.eq(ContractPosition::getSymbolCode, query.getSymbolCode().trim());
    }
    Page<ContractPosition> res = contractPositionMapper.selectPage(page, w);
    return new PageResult<>(
        res.getRecords().stream().map(this::toPositionVo).collect(Collectors.toList()),
        res.getCurrent(),
        res.getSize(),
        res.getTotal(),
        res.hasNext());
  }

  @Override
  public PageResult<ContractOrderVo> pageOpenOrders(long userId, ContractOrderOpenQuery query) {
    Page<ContractOrder> page = new Page<>(query.getPage(), query.getPageSize());
    LambdaQueryWrapper<ContractOrder> w =
        Wrappers.<ContractOrder>lambdaQuery()
            .eq(ContractOrder::getUserId, userId)
            .in(ContractOrder::getStatus, new ArrayList<>(ContractOrderStatus.OPEN_SET))
            .orderByDesc(ContractOrder::getCreatedAt);
    if (query.getSymbolCode() != null && !query.getSymbolCode().isBlank()) {
      w.eq(ContractOrder::getSymbolCode, query.getSymbolCode().trim());
    }
    Page<ContractOrder> res = contractOrderMapper.selectPage(page, w);
    return toOrderPage(res);
  }

  @Override
  public PageResult<ContractOrderVo> pageHistoryOrders(long userId, ContractOrderHistoryQuery query) {
    Page<ContractOrder> page = new Page<>(query.getPage(), query.getPageSize());
    LambdaQueryWrapper<ContractOrder> w =
        Wrappers.<ContractOrder>lambdaQuery()
            .eq(ContractOrder::getUserId, userId)
            .in(ContractOrder::getStatus, new ArrayList<>(ContractOrderStatus.HISTORY_TERMINAL_SET))
            .orderByDesc(ContractOrder::getCreatedAt);
    if (query.getSymbolCode() != null && !query.getSymbolCode().isBlank()) {
      w.eq(ContractOrder::getSymbolCode, query.getSymbolCode().trim());
    }
    Page<ContractOrder> res = contractOrderMapper.selectPage(page, w);
    return toOrderPage(res);
  }

  private PageResult<ContractOrderVo> toOrderPage(Page<ContractOrder> res) {
    return new PageResult<>(
        res.getRecords().stream().map(this::toOrderVo).collect(Collectors.toList()),
        res.getCurrent(),
        res.getSize(),
        res.getTotal(),
        res.hasNext());
  }

  private Optional<ContractOrder> findByClientOrderId(long userId, String clientOrderId) {
    return Optional.ofNullable(
        contractOrderMapper.selectOne(
            Wrappers.<ContractOrder>lambdaQuery()
                .eq(ContractOrder::getUserId, userId)
                .eq(ContractOrder::getClientOrderId, clientOrderId)));
  }

  private String normalizeClientKey(String raw) {
    if (raw == null || raw.isBlank()) {
      return null;
    }
    return raw.trim();
  }

  private ContractSymbol loadTradingSymbol(String symbolCode) {
    ContractSymbol sym =
        contractSymbolMapper.selectOne(
            Wrappers.<ContractSymbol>lambdaQuery()
                .eq(ContractSymbol::getSymbolCode, symbolCode));
    if (sym == null) {
      throw new BusinessException(ErrorCode.CONTRACT_SYMBOL_NOT_FOUND);
    }
    if (sym.getStatus() != ContractSymbolStatus.TRADING) {
      throw new BusinessException(ErrorCode.CONTRACT_SYMBOL_DISABLED);
    }
    return sym;
  }

  private ContractUserSymbolConfig loadOrCreateConfig(long userId, ContractSymbol sym) {
    ContractUserSymbolConfig c =
        contractUserSymbolConfigMapper.selectOne(
            Wrappers.<ContractUserSymbolConfig>lambdaQuery()
                .eq(ContractUserSymbolConfig::getUserId, userId)
                .eq(ContractUserSymbolConfig::getSymbolCode, sym.getSymbolCode()));
    LocalDateTime now = LocalDateTime.now();
    if (c != null) {
      return c;
    }
    c = new ContractUserSymbolConfig();
    c.setUserId(userId);
    c.setSymbolCode(sym.getSymbolCode());
    c.setLeverage(Math.min(20, sym.getMaxLeverage()));
    c.setMarginMode(ContractMarginMode.CROSS);
    c.setVersion(0);
    c.setCreatedAt(now);
    c.setUpdatedAt(now);
    contractUserSymbolConfigMapper.insert(c);
    return c;
  }

  private int effectiveLeverage(Integer dtoLeverage, ContractUserSymbolConfig pref, ContractSymbol sym) {
    int lev = dtoLeverage != null ? dtoLeverage : pref.getLeverage();
    if (lev < 1) {
      lev = 1;
    }
    return Math.min(lev, sym.getMaxLeverage());
  }

  private void syncUserPreference(
      long userId, ContractSymbol sym, int leverage, ContractMarginMode marginMode) {
    ContractUserSymbolConfig cfg = loadOrCreateConfig(userId, sym);
    cfg.setLeverage(leverage);
    cfg.setMarginMode(marginMode);
    cfg.setUpdatedAt(LocalDateTime.now());
    contractUserSymbolConfigMapper.updateById(cfg);
  }

  private ContractOrderVo toOrderVo(ContractOrder o) {
    return ContractOrderVo.builder()
        .id(o.getId())
        .symbolCode(o.getSymbolCode())
        .clientOrderId(o.getClientOrderId())
        .positionSide(o.getPositionSide().name())
        .positionEffect(o.getPositionEffect().name())
        .tradeSide(o.getTradeSide().name())
        .orderType(o.getOrderType().name())
        .price(o.getPrice())
        .quantity(o.getQuantity())
        .quoteQty(o.getQuoteQty())
        .filledQty(o.getFilledQty())
        .avgFillPrice(o.getAvgFillPrice())
        .reduceOnly(o.getReduceOnly() != null && o.getReduceOnly() == 1)
        .frozenMargin(o.getFrozenMargin())
        .leverageSnapshot(o.getLeverageSnapshot())
        .marginModeSnapshot(o.getMarginModeSnapshot().name())
        .takeProfitPrice(o.getTakeProfitPrice())
        .stopLossPrice(o.getStopLossPrice())
        .conditionalTriggerPrice(o.getConditionalTriggerPrice())
        .status(o.getStatus().name())
        .timeInForce(o.getTimeInForce().name())
        .rejectReason(o.getRejectReason())
        .createdAt(o.getCreatedAt())
        .updatedAt(o.getUpdatedAt())
        .build();
  }

  private ContractPositionVo toPositionVo(ContractPosition p) {
    return ContractPositionVo.builder()
        .id(p.getId())
        .symbolCode(p.getSymbolCode())
        .positionSide(p.getPositionSide().name())
        .contracts(p.getContracts())
        .entryPrice(p.getEntryPrice())
        .leverage(p.getLeverage())
        .marginMode(p.getMarginMode().name())
        .isolatedMargin(p.getIsolatedMargin())
        .unrealizedPnl(p.getUnrealizedPnl())
        .liquidationPrice(p.getLiquidationPrice())
        .riskRate(p.getRiskRate())
        .createdAt(p.getCreatedAt())
        .updatedAt(p.getUpdatedAt())
        .build();
  }
}
