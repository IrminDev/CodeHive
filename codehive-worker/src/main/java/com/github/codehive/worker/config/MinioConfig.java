package com.github.codehive.worker.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import io.minio.MinioClient;

@Configuration
public class MinioConfig {
    @Bean
    MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(System.getProperty("minio.url", "http://localhost:9000"))
                .credentials(
                        System.getProperty("minio.accessKey", "minioadmin"),
                        System.getProperty("minio.secretKey", "minioadmin"))
                .build();
    }
}
