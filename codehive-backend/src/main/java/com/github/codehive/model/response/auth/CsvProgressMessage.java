package com.github.codehive.model.response.auth;

import java.time.LocalDateTime;

public class CsvProgressMessage {

    public enum Status {
        PROCESSING, ROW_SUCCESS, ROW_ERROR, COMPLETED
    }

    private String taskId;
    private Status status;
    private int currentRow;
    private int totalRows;
    private int successCount;
    private int errorCount;
    private String message;
    private LocalDateTime timestamp;

    public CsvProgressMessage() {
        this.timestamp = LocalDateTime.now();
    }

    public CsvProgressMessage(String taskId, Status status, int currentRow, int totalRows,
                              int successCount, int errorCount, String message) {
        this.taskId = taskId;
        this.status = status;
        this.currentRow = currentRow;
        this.totalRows = totalRows;
        this.successCount = successCount;
        this.errorCount = errorCount;
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }

    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public int getCurrentRow() { return currentRow; }
    public void setCurrentRow(int currentRow) { this.currentRow = currentRow; }
    public int getTotalRows() { return totalRows; }
    public void setTotalRows(int totalRows) { this.totalRows = totalRows; }
    public int getSuccessCount() { return successCount; }
    public void setSuccessCount(int successCount) { this.successCount = successCount; }
    public int getErrorCount() { return errorCount; }
    public void setErrorCount(int errorCount) { this.errorCount = errorCount; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
