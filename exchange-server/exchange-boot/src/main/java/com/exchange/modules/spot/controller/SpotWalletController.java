package com.exchange.modules.spot.controller;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.exchange.common.api.Result;
import com.exchange.modules.spot.entity.SpotAccountBalance;
import com.exchange.modules.spot.mapper.SpotAccountBalanceMapper;
import com.exchange.modules.spot.vo.SpotBalanceRowVo;
import com.exchange.security.SecurityUtils;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/spot/wallet")
@RequiredArgsConstructor
public class SpotWalletController {

  private final SpotAccountBalanceMapper spotAccountBalanceMapper;

  @GetMapping("/balances")
  public Result<List<SpotBalanceRowVo>> balances() {
    long userId = SecurityUtils.requireUserId();
    List<SpotAccountBalance> rows =
        spotAccountBalanceMapper.selectList(
            Wrappers.<SpotAccountBalance>lambdaQuery()
                .eq(SpotAccountBalance::getUserId, userId)
                .orderByAsc(SpotAccountBalance::getAsset));
    List<SpotBalanceRowVo> list =
        rows.stream()
            .map(
                r ->
                    new SpotBalanceRowVo(
                        r.getAsset(), r.getAvailable(), r.getFrozen()))
            .toList();
    return Result.ok(list);
  }
}
