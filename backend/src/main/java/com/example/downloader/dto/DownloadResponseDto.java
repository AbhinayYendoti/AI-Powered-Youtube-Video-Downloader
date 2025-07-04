package com.example.downloader.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class DownloadResponseDto {
    
    private String status;
    private String message;
    
    @JsonProperty("download_id")
    private String downloadId;
    
    @JsonProperty("file_path")
    private String filePath;
    
    @JsonProperty("file_name")
    private String fileName;
    
    @JsonProperty("file_size")
    private Long fileSize;
    
    @JsonProperty("download_url")
    private String downloadUrl;
    
    public DownloadResponseDto() {}
    
    public DownloadResponseDto(String status, String message) {
        this.status = status;
        this.message = message;
    }
    
    public DownloadResponseDto(String status, String message, String downloadId) {
        this.status = status;
        this.message = message;
        this.downloadId = downloadId;
    }
    
    // Getters and Setters
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getDownloadId() {
        return downloadId;
    }
    
    public void setDownloadId(String downloadId) {
        this.downloadId = downloadId;
    }
    
    public String getFilePath() {
        return filePath;
    }
    
    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }
    
    public String getFileName() {
        return fileName;
    }
    
    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
    
    public Long getFileSize() {
        return fileSize;
    }
    
    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }
    
    public String getDownloadUrl() {
        return downloadUrl;
    }
    
    public void setDownloadUrl(String downloadUrl) {
        this.downloadUrl = downloadUrl;
    }
} 