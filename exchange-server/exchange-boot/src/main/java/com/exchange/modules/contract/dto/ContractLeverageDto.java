package com.exchange.modules.contract.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ContractLeverageDto {

  @NotBlank private String symbolCode;

  @NotNull private Integer leverage;
}
