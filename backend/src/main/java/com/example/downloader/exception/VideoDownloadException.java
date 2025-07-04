package com.example.downloader.exception;

public class VideoDownloadException extends RuntimeException {
    
    public VideoDownloadException(String message) {
        super(message);
    }
    
    public VideoDownloadException(String message, Throwable cause) {
        super(message, cause);
    }
    
    public VideoDownloadException(Throwable cause) {
        super(cause);
    }
} 