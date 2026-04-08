package com.exchange.modules.marketdata.provider;

import com.exchange.modules.marketdata.domain.MarketDataType;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ProviderRegistry {

  private final List<MarketDataProvider> providers;

  public List<MarketDataProvider> orderedProviders(MarketDataType type) {
    return providers.stream()
        .filter(p -> p.supports(type))
        .sorted(Comparator.comparingInt(MarketDataProvider::priority))
        .toList();
  }
}

