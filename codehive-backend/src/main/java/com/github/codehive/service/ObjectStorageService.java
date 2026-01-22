package com.github.codehive.service;

import java.io.InputStream;

import org.springframework.stereotype.Service;

import io.minio.MinioClient;

@Service
public class ObjectStorageService {
    private final MinioClient minioClient;
    private final String bucketName = System.getProperty("minio.bucketName", "codehive");
    
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

    public InputStream download(String objectKey) throws Exception {
        return minioClient.getObject(
            io.minio.GetObjectArgs.builder()
                .bucket(bucketName)
                .object(objectKey)
                .build()
        );
    }
}
