package com.github.codehive.worker.service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ObjectStorageService {
    private static final Logger logger = LoggerFactory.getLogger(ObjectStorageService.class);
    private final MinioClient minioClient;

    @Value("${minio.bucketName}")
    private String bucketName;
    
    public ObjectStorageService(MinioClient minioClient) {
        this.minioClient = minioClient;
    }

    public InputStream download(String objectKey) throws Exception {
        return minioClient.getObject(
            GetObjectArgs.builder()
                .bucket(bucketName)
                .object(objectKey)
                .build()
        );
    }

    public void upload(String objectKey, String content) throws Exception {
        byte[] contentBytes = content.getBytes(StandardCharsets.UTF_8);
        ByteArrayInputStream stream = new ByteArrayInputStream(contentBytes);
        
        minioClient.putObject(
            PutObjectArgs.builder()
                .bucket(bucketName)
                .object(objectKey)
                .stream(stream, contentBytes.length, -1)
                .contentType("text/plain")
                .build()
        );
        
        logger.info("Uploaded content to MinIO: {}", objectKey);
    }

    public void upload(String objectKey, InputStream content, long size) throws Exception {
        minioClient.putObject(
            PutObjectArgs.builder()
                .bucket(bucketName)
                .object(objectKey)
                .stream(content, size, -1)
                .contentType("application/octet-stream")
                .build()
        );
        
        logger.info("Uploaded stream to MinIO: {}", objectKey);
    }
}
