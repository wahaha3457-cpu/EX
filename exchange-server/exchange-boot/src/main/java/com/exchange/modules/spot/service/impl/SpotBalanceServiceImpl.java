package com.exchange.modules.spot.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.exchange.common.exception.BusinessException;
import com.exchange.common.exception.ErrorCode;
import com.exchange.modules.spot.entity.SpotAccountBalance;
import com.exchange.modules.spot.enums.SpotOrderSide;
import com.exchange.modules.spot.mapper.SpotAccountBalanceMapper;
import com.exchange.modules.spot.service.SpotBalanceService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SpotBalanceServiceImpl implements SpotBalanceService {

  private static final int MAX_RETRY = 4;

  private final SpotAccountBalanceMapper spotAccountBalanceMapper;

  @Override
  @Transactional(rollbackFor = Exception.class)
  public void freezeSpotOrder(
      Long userId,
      String baseCoin,
      String quoteCoin,
      BigDecimal frozenBase,
      BigDecimal frozenQuote) {
    move(userId, baseCoin, frozenBase, true);
    move(userId, quoteCoin, frozenQuote, true);
  }

  @Override
  @Transactional(rollbackFor = Exception.class)
  public void releaseSpotOrder(
      Long userId,
      String baseCoin,
      String quoteCoin,
      BigDecimal frozenBase,
      BigDecimal frozenQuote) {
    move(userId, baseCoin, frozenBase, false);
    move(userId, quoteCoin, frozenQuote, false);
  }

  private static final BigDecimal TAKER_FEE_RATE = new BigDecimal("0.001");

  @Override
  @Transactional(rollbackFor = Exception.class)
  public void settleLimitOrderFill(
      Long userId,
      String baseCoin,
      String quoteCoin,
      SpotOrderSide side,
      BigDecimal quantity,
      BigDecimal fillPrice,
      BigDecimal frozenBase,
      BigDecimal frozenQuote) {
    releaseSpotOrder(userId, baseCoin, quoteCoin, frozenBase, frozenQuote);
    BigDecimal gross = fillPrice.multiply(quantity).setScale(18, RoundingMode.HALF_UP);
    BigDecimal fee = gross.multiply(TAKER_FEE_RATE).setScale(18, RoundingMode.HALF_UP);
    if (side == SpotOrderSide.BUY) {
      adjustAvailable(userId, quoteCoin, gross.add(fee).negate());
      adjustAvailable(userId, baseCoin, quantity);
    } else {
      adjustAvailable(userId, baseCoin, quantity.negate());
      adjustAvailable(userId, quoteCoin, gross.subtract(fee));
    }
  }

  /** 仅调整可用余额（正加负减），带乐观重试 */
  private void adjustAvailable(Long userId, String asset, BigDecimal delta) {
    if (delta == null || delta.compareTo(BigDecimal.ZERO) == 0) {
      return;
    }
    ensureRow(userId, asset);
    for (int i = 0; i < MAX_RETRY; i++) {
      SpotAccountBalance row =
          spotAccountBalanceMapper.selectOne(
              Wrappers.<SpotAccountBalance>lambdaQuery()
                  .eq(SpotAccountBalance::getUserId, userId)
                  .eq(SpotAccountBalance::getAsset, asset));
      if (row == null) {
        throw new BusinessException(ErrorCode.SYS_INTERNAL_ERROR, "余额行不存在: " + asset);
      }
      BigDecimal nextAvail = row.getAvailable().add(delta);
      if (nextAvail.compareTo(BigDecimal.ZERO) < 0) {
        throw new BusinessException(
            ErrorCode.SPOT_INSUFFICIENT_BALANCE, "成交结算后可用余额不足: " + asset);
      }
      row.setAvailable(nextAvail);
      int n = spotAccountBalanceMapper.updateById(row);
      if (n == 1) {
        return;
      }
    }
    throw new BusinessException(ErrorCode.SYS_INTERNAL_ERROR, "余额更新冲突，请重试");
  }

  /**
   * @param freeze true: available → frozen；false: frozen → available
   */
  private void move(Long userId, String asset, BigDecimal amount, boolean freeze) {
    if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
      return;
    }
    ensureRow(userId, asset);
    for (int i = 0; i < MAX_RETRY; i++) {
      SpotAccountBalance row =
          spotAccountBalanceMapper.selectOne(
              Wrappers.<SpotAccountBalance>lambdaQuery()
                  .eq(SpotAccountBalance::getUserId, userId)
                  .eq(SpotAccountBalance::getAsset, asset));
      if (row == null) {
        throw new BusinessException(ErrorCode.SYS_INTERNAL_ERROR, "余额行不存在: " + asset);
      }
      BigDecimal nextAvail;
      BigDecimal nextFrozen;
      if (freeze) {
        if (row.getAvailable().compareTo(amount) < 0) {
          throw new BusinessException(ErrorCode.SPOT_INSUFFICIENT_BALANCE);
        }
        nextAvail = row.getAvailable().subtract(amount);
        nextFrozen = row.getFrozen().add(amount);
      } else {
        if (row.getFrozen().compareTo(amount) < 0) {
          throw new BusinessException(
              ErrorCode.SYS_INTERNAL_ERROR, "冻结余额不足，无法解冻: " + asset);
        }
        nextAvail = row.getAvailable().add(amount);
        nextFrozen = row.getFrozen().subtract(amount);
      }
      row.setAvailable(nextAvail);
      row.setFrozen(nextFrozen);
      int n = spotAccountBalanceMapper.updateById(row);
      if (n == 1) {
        return;
      }
    }
    throw new BusinessException(ErrorCode.SYS_INTERNAL_ERROR, "余额更新冲突，请重试");
  }

  private void ensureRow(Long userId, String asset) {
    SpotAccountBalance existing =
        spotAccountBalanceMapper.selectOne(
            Wrappers.<SpotAccountBalance>lambdaQuery()
                .eq(SpotAccountBalance::getUserId, userId)
                .eq(SpotAccountBalance::getAsset, asset));
    if (existing != null) {
      return;
    }
    LocalDateTime now = LocalDateTime.now();
    SpotAccountBalance row = new SpotAccountBalance();
    row.setUserId(userId);
    row.setAsset(asset);
    row.setAvailable(BigDecimal.ZERO);
    row.setFrozen(BigDecimal.ZERO);
    row.setCreatedAt(now);
    row.setUpdatedAt(now);
    try {
      spotAccountBalanceMapper.insert(row);
    } catch (DuplicateKeyException ignored) {
      // 并发创建唯一行
    }
  }
}
