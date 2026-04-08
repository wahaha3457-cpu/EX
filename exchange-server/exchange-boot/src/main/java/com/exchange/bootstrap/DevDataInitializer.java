package com.exchange.bootstrap;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.exchange.modules.contract.entity.ContractWallet;
import com.exchange.modules.contract.mapper.ContractWalletMapper;
import com.exchange.modules.spot.entity.SpotAccountBalance;
import com.exchange.modules.spot.mapper.SpotAccountBalanceMapper;
import com.exchange.modules.user.entity.User;
import com.exchange.modules.user.enums.UserStatus;
import com.exchange.modules.user.mapper.UserMapper;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DevDataInitializer implements ApplicationRunner {

  private final UserMapper userMapper;
  private final PasswordEncoder passwordEncoder;
  private final SpotAccountBalanceMapper spotAccountBalanceMapper;
  private final ContractWalletMapper contractWalletMapper;

  @Override
  public void run(ApplicationArguments args) {
    long count = userMapper.selectCount(new QueryWrapper<>());
    if (count == 0) {
      User u = new User();
      u.setUserCode("U100001");
      u.setEmail("demo@exchange.com");
      u.setPasswordHash(passwordEncoder.encode("password123"));
      u.setStatus(UserStatus.ACTIVE);
      LocalDateTime now = LocalDateTime.now();
      u.setCreatedAt(now);
      u.setUpdatedAt(now);
      userMapper.insert(u);
      log.info("Dev seed user created: demo@exchange.com / password123");
    }

    // Dev admin user (userCode prefix "A" grants ROLE_ADMIN)
    User admin =
        userMapper.selectOne(
            Wrappers.<User>lambdaQuery().eq(User::getEmail, "admin@exchange.com"));
    if (admin == null) {
      User a = new User();
      a.setUserCode("A100001");
      a.setEmail("admin@exchange.com");
      a.setPasswordHash(passwordEncoder.encode("admin12345"));
      a.setStatus(UserStatus.ACTIVE);
      LocalDateTime now = LocalDateTime.now();
      a.setCreatedAt(now);
      a.setUpdatedAt(now);
      userMapper.insert(a);
      log.info("Dev admin user created: admin@exchange.com / admin12345");
      admin = a;
    }

    User demo =
        userMapper.selectOne(
            Wrappers.<User>lambdaQuery().eq(User::getEmail, "demo@exchange.com"));
    if (demo != null) {
      seedSpotBalancesIfAbsent(demo.getId());
      seedContractWalletIfAbsent(demo.getId());
    }
    if (admin != null) {
      seedSpotBalancesIfAbsent(admin.getId());
      seedContractWalletIfAbsent(admin.getId());
    }
  }

  private void seedSpotBalancesIfAbsent(Long userId) {
    long n =
        spotAccountBalanceMapper.selectCount(
            Wrappers.<SpotAccountBalance>lambdaQuery()
                .eq(SpotAccountBalance::getUserId, userId));
    if (n > 0) {
      return;
    }
    LocalDateTime now = LocalDateTime.now();
    insertBal(userId, "BTC", new BigDecimal("5.000000000000000000"), now);
    insertBal(userId, "USDT", new BigDecimal("500000.000000000000000000"), now);
    log.info("Dev spot_account_balance seeded for userId={}", userId);
  }

  private void insertBal(Long userId, String asset, BigDecimal available, LocalDateTime now) {
    SpotAccountBalance b = new SpotAccountBalance();
    b.setUserId(userId);
    b.setAsset(asset);
    b.setAvailable(available);
    b.setFrozen(BigDecimal.ZERO);
    b.setCreatedAt(now);
    b.setUpdatedAt(now);
    spotAccountBalanceMapper.insert(b);
  }

  private void seedContractWalletIfAbsent(Long userId) {
    long n =
        contractWalletMapper.selectCount(
            Wrappers.<ContractWallet>lambdaQuery()
                .eq(ContractWallet::getUserId, userId)
                .eq(ContractWallet::getAsset, "USDT"));
    if (n > 0) {
      return;
    }
    LocalDateTime now = LocalDateTime.now();
    ContractWallet w = new ContractWallet();
    w.setUserId(userId);
    w.setAsset("USDT");
    w.setAvailable(new BigDecimal("2000000.000000000000000000"));
    w.setFrozen(BigDecimal.ZERO);
    w.setCreatedAt(now);
    w.setUpdatedAt(now);
    contractWalletMapper.insert(w);
    log.info("Dev contract_wallet (USDT) seeded for userId={}", userId);
  }
}
