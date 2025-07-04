package com.example.downloader.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class DownloadRequest {
    
    @NotBlank(message = "URL is required")
    @Pattern(regexp = "^(https?://)?(www\\.)?(youtube\\.com/watch\\?v=|youtu\\.be/|youtube\\.com/embed/|youtube\\.com/v/)[\\w-]+(\\?.*)?$", 
             message = "Please provide a valid YouTube URL")
    private String url;
    
    private String format = "video"; // video or audio
    private String quality = "best"; // best, 1080p, 720p, 480p, 360p, 320, 256, 128
    
    public DownloadRequest() {}
    
    public DownloadRequest(String url) {
        this.url = url;
    }
    
    public DownloadRequest(String url, String format, String quality) {
        this.url = url;
        this.format = format;
        this.quality = quality;
    }
    
    // Getters and Setters
    public String getUrl() {
        return url;
    }
    
    public void setUrl(String url) {
        this.url = url;
    }
    
    public String getFormat() {
        return format;
    }
    
    public void setFormat(String format) {
        this.format = format;
    }
    
    public String getQuality() {
        return quality;
    }
    
    public void setQuality(String quality) {
        this.quality = quality;
    }
    
    @Override
    public String toString() {
        return "DownloadRequest{" +
                "url='" + url + '\'' +
                ", format='" + format + '\'' +
                ", quality='" + quality + '\'' +
                '}';
    }
} 