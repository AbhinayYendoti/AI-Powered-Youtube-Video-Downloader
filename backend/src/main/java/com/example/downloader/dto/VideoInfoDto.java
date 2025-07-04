package com.example.downloader.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class VideoInfoDto {
    
    @JsonProperty("video_id")
    private String videoId;
    
    private String title;
    private String description;
    private String thumbnail;
    private Long duration;
    private String uploader;
    private String url;
    
    @JsonProperty("available_formats")
    private String[] availableFormats;
    
    @JsonProperty("available_qualities")
    private String[] availableQualities;
    
    public VideoInfoDto() {}
    
    public VideoInfoDto(String videoId, String title, String url) {
        this.videoId = videoId;
        this.title = title;
        this.url = url;
    }
    
    // Getters and Setters
    public String getVideoId() {
        return videoId;
    }
    
    public void setVideoId(String videoId) {
        this.videoId = videoId;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getThumbnail() {
        return thumbnail;
    }
    
    public void setThumbnail(String thumbnail) {
        this.thumbnail = thumbnail;
    }
    
    public Long getDuration() {
        return duration;
    }
    
    public void setDuration(Long duration) {
        this.duration = duration;
    }
    
    public String getUploader() {
        return uploader;
    }
    
    public void setUploader(String uploader) {
        this.uploader = uploader;
    }
    
    public String getUrl() {
        return url;
    }
    
    public void setUrl(String url) {
        this.url = url;
    }
    
    public String[] getAvailableFormats() {
        return availableFormats;
    }
    
    public void setAvailableFormats(String[] availableFormats) {
        this.availableFormats = availableFormats;
    }
    
    public String[] getAvailableQualities() {
        return availableQualities;
    }
    
    public void setAvailableQualities(String[] availableQualities) {
        this.availableQualities = availableQualities;
    }
} 