package com.example.downloader.service;

import com.example.downloader.dto.VideoInfoDto;
import com.example.downloader.exception.VideoDownloadException;
import com.example.downloader.model.VideoInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class VideoInfoService {
    
    @Autowired
    private VideoDownloadService downloadService;
    
    public VideoInfoDto getVideoInfo(String url) throws VideoDownloadException {
        return downloadService.getVideoInfo(url);
    }
    
    public VideoInfoDto extractVideoInfo(String url) throws VideoDownloadException {
        // Extract video ID from URL
        String videoId = extractVideoId(url);
        if (videoId == null) {
            throw new VideoDownloadException("Invalid YouTube URL");
        }
        
        // Get detailed video info using yt-dlp
        return downloadService.getVideoInfo(url);
    }
    
    private String extractVideoId(String url) {
        if (url == null || url.trim().isEmpty()) {
            return null;
        }
        
        // Handle different YouTube URL formats
        if (url.contains("youtube.com/watch?v=")) {
            int startIndex = url.indexOf("v=") + 2;
            int endIndex = url.indexOf("&", startIndex);
            if (endIndex == -1) {
                endIndex = url.length();
            }
            return url.substring(startIndex, endIndex);
        } else if (url.contains("youtu.be/")) {
            int startIndex = url.indexOf("youtu.be/") + 9;
            int endIndex = url.indexOf("?", startIndex);
            if (endIndex == -1) {
                endIndex = url.length();
            }
            return url.substring(startIndex, endIndex);
        }
        
        return null;
    }
} 