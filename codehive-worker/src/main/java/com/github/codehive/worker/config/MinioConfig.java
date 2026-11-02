package com.github.codehive.worker.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import io.minio.MinioClient;

@Configuration
public class MinioConfig {
    @Value("${minio.url}")
    private String minioUrl;

    @Value("${minio.accessKey}")
    private String minioAccessKey;

    @Value("${minio.secretKey}")
    private String minioSecretKey;

    @Value("${minio.region:}")
    private String minioRegion;
    
    @Bean
    MinioClient minioClient() {
        MinioClient.Builder builder = MinioClient.builder()
                .endpoint(minioUrl)
                .credentials(minioAccessKey, minioSecretKey);
        // Skips GetBucketLocation, which Cloud Storage denies without storage.buckets.get.
        if (StringUtils.hasText(minioRegion)) {
            builder.region(minioRegion);
        }
        return builder.build();
    }
}
