package com.github.codehive.service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;

@Service
public class ObjectStorageService {
    private final MinioClient minioClient;

    @Value("${minio.bucketName}")
    private String bucketName;
    
    public ObjectStorageService(MinioClient minioClient) {
        this.minioClient = minioClient;
    }

    public void upload(String objectKey, InputStream data, long size, String contentType) throws Exception {
        minioClient.putObject(
            io.minio.PutObjectArgs.builder()
                .bucket(bucketName)
                .object(objectKey)
                .stream(data, size, -1)
                .contentType(contentType)
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
    }


    public InputStream download(String objectKey) throws Exception {
        return minioClient.getObject(
            io.minio.GetObjectArgs.builder()
                .bucket(bucketName)
                .object(objectKey)
                .build()
        );
    }
}
