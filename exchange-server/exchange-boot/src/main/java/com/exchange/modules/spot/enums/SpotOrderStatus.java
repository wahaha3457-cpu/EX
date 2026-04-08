package com.exchange.modules.spot.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import java.util.EnumSet;
import java.util.Set;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 订单状态。撮合引擎接入后，除撤单/拒单外终态由撮合回写；应用层通过 version 乐观锁与消息幂等保证一致。
 *
 * <p>流转概要：
 *
 * <ul>
 *   <li>NEW：已接受、已冻结保证金，等待撮合队列
 *   <li>PARTIALLY_FILLED：部分成交，剩余继续排队或可被撤单
 *   <li>FILLED：全部成交
 *   <li>CANCELED：用户撤单或系统撤单成功（未成交部分解冻）
 *   <li>REJECTED：风控/校验失败（下单时即失败或入队前被拒绝）
 *   <li>EXPIRED：仅当支持 TTL/IOC/FOK 等业务时由撮合置位（主干预留）
 * </ul>
 */
@Getter
@RequiredArgsConstructor
public enum SpotOrderStatus {

  NEW(1),
  PARTIALLY_FILLED(2),
  FILLED(3),
  CANCELED(4),
  REJECTED(5),
  EXPIRED(6),
  ;

  @EnumValue private final int code;

  /** 当前委托（可撤单） */
  public static final Set<SpotOrderStatus> OPEN_SET =
      EnumSet.of(NEW, PARTIALLY_FILLED);

  /** 历史终态（不含部分成交中的未完成单） */
  public static final Set<SpotOrderStatus> HISTORY_TERMINAL_SET =
      EnumSet.of(FILLED, CANCELED, REJECTED, EXPIRED);

  public static SpotOrderStatus fromCode(int code) {
    for (SpotOrderStatus v : values()) {
      if (v.code == code) {
        return v;
      }
    }
    throw new IllegalArgumentException("Unknown SpotOrderStatus: " + code);
  }

  public boolean isOpen() {
    return OPEN_SET.contains(this);
  }
}
