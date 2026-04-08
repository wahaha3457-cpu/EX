package com.exchange.modules.contract.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.exchange.common.exception.BusinessException;
import com.exchange.common.exception.ErrorCode;
import com.exchange.modules.contract.entity.ContractWallet;
import com.exchange.modules.contract.mapper.ContractWalletMapper;
import com.exchange.modules.contract.service.ContractWalletService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ContractWalletServiceImpl implements ContractWalletService {

  public static final String QUOTE_ASSET = "USDT";

  private static final int MAX_RETRY = 4;

  private final ContractWalletMapper contractWalletMapper;

  @Override
  @Transactional(rollbackFor = Exception.class)
  public void freezeMargin(Long userId, BigDecimal amountUsdt) {
    move(userId, amountUsdt, true);
  }

  @Override
  @Transactional(rollbackFor = Exception.class)
  public void releaseMargin(Long userId, BigDecimal amountUsdt) {
    move(userId, amountUsdt, false);
  }

  private void move(Long userId, BigDecimal amount, boolean freeze) {
    if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
      return;
    }
    ensureWallet(userId);
    for (int i = 0; i < MAX_RETRY; i++) {
      ContractWallet row =
          contractWalletMapper.selectOne(
              Wrappers.<ContractWallet>lambdaQuery()
                  .eq(ContractWallet::getUserId, userId)
                  .eq(ContractWallet::getAsset, QUOTE_ASSET));
      if (row == null) {
        throw new BusinessException(ErrorCode.SYS_INTERNAL_ERROR, "合约钱包不存在");
      }
      BigDecimal nextAvail;
      BigDecimal nextFrozen;
      if (freeze) {
        if (row.getAvailable().compareTo(amount) < 0) {
          throw new BusinessException(ErrorCode.CONTRACT_INSUFFICIENT_MARGIN);
        }
        nextAvail = row.getAvailable().subtract(amount);
        nextFrozen = row.getFrozen().add(amount);
      } else {
        if (row.getFrozen().compareTo(amount) < 0) {
          throw new BusinessException(
              ErrorCode.SYS_INTERNAL_ERROR, "合约冻结余额不足，无法释放");
        }
        nextAvail = row.getAvailable().add(amount);
        nextFrozen = row.getFrozen().subtract(amount);
      }
      row.setAvailable(nextAvail);
      row.setFrozen(nextFrozen);
      int n = contractWalletMapper.updateById(row);
      if (n == 1) {
        return;
      }
    }
    throw new BusinessException(ErrorCode.SYS_INTERNAL_ERROR, "合约钱包更新冲突，请重试");
  }

  private void ensureWallet(Long userId) {
    ContractWallet w =
        contractWalletMapper.selectOne(
            Wrappers.<ContractWallet>lambdaQuery()
                .eq(ContractWallet::getUserId, userId)
                .eq(ContractWallet::getAsset, QUOTE_ASSET));
    if (w != null) {
      return;
    }
    LocalDateTime now = LocalDateTime.now();
    ContractWallet row = new ContractWallet();
    row.setUserId(userId);
    row.setAsset(QUOTE_ASSET);
    row.setAvailable(BigDecimal.ZERO);
    row.setFrozen(BigDecimal.ZERO);
    row.setCreatedAt(now);
    row.setUpdatedAt(now);
    try {
      contractWalletMapper.insert(row);
    } catch (DuplicateKeyException ignored) {
      // 并发创建
    }
  }
}
