package com.github.codehive.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.minio.MinioClient;

@Configuration
public class MinioConfig {
    @Bean
    MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(System.getProperty("minio.url", "http://exampleurl.com:9000"))
                .credentials(
                        System.getProperty("minio.accessKey", "accesskey"),
                        System.getProperty("minio.secretKey", "secretkey"))
                .build();
    }
}
