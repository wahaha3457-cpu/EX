package com.exchange.modules.marketdata.http;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import okhttp3.HttpUrl;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class HttpJsonClient {

  private final ObjectMapper objectMapper;

  private final OkHttpClient client =
      new OkHttpClient.Builder()
          .callTimeout(Duration.ofSeconds(4))
          .connectTimeout(Duration.ofSeconds(2))
          .readTimeout(Duration.ofSeconds(4))
          .writeTimeout(Duration.ofSeconds(4))
          .retryOnConnectionFailure(true)
          .build();

  public JsonNode getJson(String url, Map<String, String> query) throws IOException {
    HttpUrl.Builder b = HttpUrl.parse(url).newBuilder();
    if (query != null) {
      for (Map.Entry<String, String> e : query.entrySet()) {
        if (e.getValue() == null) continue;
        b.addQueryParameter(e.getKey(), e.getValue());
      }
    }
    Request req =
        new Request.Builder()
            .url(b.build())
            .get()
            .header("Accept", "application/json")
            .header("User-Agent", "exchange-marketdata/0.1")
            .build();
    try (Response res = client.newCall(req).execute()) {
      if (!res.isSuccessful()) {
        throw new IOException("HTTP " + res.code() + " " + res.message());
      }
      if (res.body() == null) throw new IOException("Empty body");
      return objectMapper.readTree(res.body().byteStream());
    }
  }
}

