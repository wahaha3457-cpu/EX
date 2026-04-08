package com.exchange.modules.contract.dto;

import com.exchange.modules.contract.enums.ContractMarginMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ContractMarginModeDto {

  @NotBlank private String symbolCode;

  @NotNull private ContractMarginMode marginMode;
}
