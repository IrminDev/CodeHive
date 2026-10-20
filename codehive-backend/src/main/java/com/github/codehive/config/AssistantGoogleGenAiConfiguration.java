package com.github.codehive.config;

import java.io.IOException;
import java.time.Duration;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.ai.model.google.genai.autoconfigure.chat.GoogleGenAiConnectionProperties;
import org.springframework.util.StringUtils;
import org.springframework.retry.support.RetryTemplate;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.genai.Client;
import com.google.genai.types.HttpOptions;
import com.google.genai.types.HttpRetryOptions;
import com.google.genai.types.ClientOptions;

import okhttp3.OkHttpClient;
import okhttp3.RequestBody;
import okhttp3.MediaType;
import okio.BufferedSink;

/** Spring's retry setting does not control retries inside the Google SDK. */
@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(name = "spring.ai.model.chat", havingValue = "google-genai")
public class AssistantGoogleGenAiConfiguration {
    @Bean
    public RetryTemplate assistantModelRetryTemplate() {
        return RetryTemplate.builder().maxAttempts(1).build();
    }

    @Bean(destroyMethod = "close")
    public Client assistantGoogleGenAiClient(Environment environment) throws IOException {
        var properties = Binder.get(environment)
                .bind(GoogleGenAiConnectionProperties.CONFIG_PREFIX, GoogleGenAiConnectionProperties.class)
                .orElseGet(GoogleGenAiConnectionProperties::new);
        String baseUrl = environment.getProperty("assistant.google-genai.base-url", "");
        HttpOptions.Builder httpOptions = HttpOptions.builder()
                .retryOptions(HttpRetryOptions.builder().attempts(1).build());
        if (StringUtils.hasText(baseUrl)) httpOptions.baseUrl(baseUrl);
        return clientBuilder(properties).httpOptions(httpOptions.build())
                .clientOptions(ClientOptions.builder().customHttpClient(singleAttemptHttpClient()).build())
                .build();
    }

    private OkHttpClient singleAttemptHttpClient() {
        return new OkHttpClient.Builder()
                .connectTimeout(Duration.ZERO).readTimeout(Duration.ZERO).writeTimeout(Duration.ZERO)
                .retryOnConnectionFailure(false).followRedirects(false).followSslRedirects(false)
                .addInterceptor(chain -> {
                    var request = chain.request();
                    var body = request.body();
                    if (body != null) {
                        // OkHttp can otherwise replay a POST after a 503 with Retry-After: 0.
                        RequestBody singleAttempt = new RequestBody() {
                            @Override public MediaType contentType() { return body.contentType(); }
                            @Override public long contentLength() throws IOException { return body.contentLength(); }
                            @Override public void writeTo(BufferedSink sink) throws IOException { body.writeTo(sink); }
                            @Override public boolean isOneShot() { return true; }
                        };
                        request = request.newBuilder().method(request.method(), singleAttempt).build();
                    }
                    return chain.proceed(request);
                }).build();
    }

    private Client.Builder clientBuilder(GoogleGenAiConnectionProperties properties) throws IOException {
        Client.Builder builder = Client.builder();
        boolean hasVertexConfig = StringUtils.hasText(properties.getProjectId())
                && StringUtils.hasText(properties.getLocation());
        if (!properties.isVertexAi() && StringUtils.hasText(properties.getApiKey())) {
            return builder.apiKey(properties.getApiKey()).vertexAI(false);
        }
        if (!hasVertexConfig) {
            throw new IllegalStateException("Google GenAI requires an API key or Vertex AI project and location");
        }
        builder.project(properties.getProjectId()).location(properties.getLocation()).vertexAI(true);
        if (properties.getCredentialsUri() != null) {
            try (var input = properties.getCredentialsUri().getInputStream()) {
                builder.credentials(GoogleCredentials.fromStream(input));
            }
        }
        return builder;
    }
}
