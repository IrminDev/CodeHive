package com.github.codehive.model.response.auth;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class CsvBulkRegisterResponse {
    private int totalProcessed;
    private int successCount;
    private int errorCount;
    private List<String> errors;

    public CsvBulkRegisterResponse(int totalProcessed, int successCount, int errorCount, List<String> errors) {
        this.totalProcessed = totalProcessed;
        this.successCount = successCount;
        this.errorCount = errorCount;
        this.errors = errors;
    }

    public int getTotalProcessed() { return totalProcessed; }
    public void setTotalProcessed(int totalProcessed) { this.totalProcessed = totalProcessed; }
    public int getSuccessCount() { return successCount; }
    public void setSuccessCount(int successCount) { this.successCount = successCount; }
    public int getErrorCount() { return errorCount; }
    public void setErrorCount(int errorCount) { this.errorCount = errorCount; }
    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }
}
