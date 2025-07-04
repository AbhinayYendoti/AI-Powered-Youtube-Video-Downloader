package com.example.downloader.service;

import com.example.downloader.dto.VideoInfoDto;
import com.example.downloader.exception.VideoDownloadException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class VideoDownloadService {
    
    private static final Logger logger = LoggerFactory.getLogger(VideoDownloadService.class);
    
    @Value("${app.download.directory:downloads/}")
    private String downloadDirectory;
    
    @Value("${app.download.yt-dlp.command:yt-dlp}")
    private String ytDlpCommand;
    
    @Value("${app.download.yt-dlp.timeout:300000}")
    private long timeout;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ConcurrentHashMap<String, DownloadProgress> downloadProgress = new ConcurrentHashMap<>();
    
    public static class DownloadProgress {
        private String status;
        private int progress;
        private String filePath;
        private String error;
        
        public DownloadProgress(String status) {
            this.status = status;
            this.progress = 0;
        }
        
        // Getters and Setters
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public int getProgress() { return progress; }
        public void setProgress(int progress) { this.progress = progress; }
        public String getFilePath() { return filePath; }
        public void setFilePath(String filePath) { this.filePath = filePath; }
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
    
    public VideoInfoDto getVideoInfo(String url) throws VideoDownloadException {
        try {
            // Create download directory if it doesn't exist
            createDownloadDirectory();
            
            // Build yt-dlp command for getting video info
            ProcessBuilder processBuilder = new ProcessBuilder(
                ytDlpCommand,
                "--dump-json",
                "--no-playlist",
                url
            );
            
            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();
            
            // Read the JSON output
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line);
            }
            
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new VideoDownloadException("Failed to get video info. Exit code: " + exitCode);
            }
            
            // Parse JSON response
            JsonNode videoInfo = objectMapper.readTree(output.toString());
            
            VideoInfoDto dto = new VideoInfoDto();
            dto.setVideoId(videoInfo.get("id").asText());
            dto.setTitle(videoInfo.get("title").asText());
            dto.setDescription(videoInfo.path("description").asText(""));
            dto.setThumbnail(videoInfo.path("thumbnail").asText(""));
            dto.setDuration(videoInfo.path("duration").asLong(0));
            dto.setUploader(videoInfo.path("uploader").asText(""));
            dto.setUrl(url);
            
            // Set available formats and qualities
            dto.setAvailableFormats(new String[]{"video", "audio"});
            dto.setAvailableQualities(new String[]{"best", "1080p", "720p", "480p", "360p", "320", "256", "128"});
            
            return dto;
            
        } catch (IOException | InterruptedException e) {
            logger.error("Error getting video info for URL: " + url, e);
            throw new VideoDownloadException("Failed to get video information", e);
        }
    }
    
    public String downloadVideo(String url, String format, String quality) throws VideoDownloadException {
        String downloadId = UUID.randomUUID().toString();
        DownloadProgress progress = new DownloadProgress("downloading");
        downloadProgress.put(downloadId, progress);
        
        CompletableFuture.runAsync(() -> {
            try {
                performDownload(downloadId, url, format, quality);
            } catch (Exception e) {
                logger.error("Download failed for ID: " + downloadId, e);
                progress.setStatus("error");
                progress.setError(e.getMessage());
            }
        });
        
        return downloadId;
    }
    
    private void performDownload(String downloadId, String url, String format, String quality) {
        DownloadProgress progress = downloadProgress.get(downloadId);
        if (progress == null) return;
        
        try {
            progress.setStatus("downloading");
            progress.setProgress(0);
            
            // Create download directory if it doesn't exist
            createDownloadDirectory();
            
            // Build yt-dlp command
            ProcessBuilder processBuilder = new ProcessBuilder();
            processBuilder.command().add(ytDlpCommand);
            processBuilder.command().add("--no-playlist");
            
            // Set output template
            String outputTemplate = downloadDirectory + "%(title)s.%(ext)s";
            processBuilder.command().add("-o");
            processBuilder.command().add(outputTemplate);
            
            // Set format based on type
            if ("audio".equals(format)) {
                processBuilder.command().add("-x");
                processBuilder.command().add("--audio-format");
                processBuilder.command().add("mp3");
                if (!"best".equals(quality)) {
                    processBuilder.command().add("--audio-quality");
                    processBuilder.command().add(quality + "k");
                }
            } else {
                // Video format
                if (!"best".equals(quality)) {
                    processBuilder.command().add("-f");
                    // Use a simpler, more reliable format specification
                    String height = quality.replace("p", "");
                    processBuilder.command().add("best[height<=" + height + "]/best");
                }
            }
            
            processBuilder.command().add(url);
            
            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();
            
            // Monitor progress
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                logger.debug("yt-dlp output: " + line);
                
                // Parse progress from yt-dlp output
                if (line.contains("%")) {
                    try {
                        String percentStr = line.replaceAll(".*?(\\d+\\.?\\d*)%.*", "$1");
                        int percent = (int) Double.parseDouble(percentStr);
                        progress.setProgress(Math.min(percent, 100));
                    } catch (NumberFormatException e) {
                        // Ignore parsing errors
                    }
                }
            }
            
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                progress.setStatus("error");
                progress.setError("Download failed with exit code: " + exitCode);
                return;
            }
            
            // Find downloaded file
            File downloadDir = new File(downloadDirectory);
            File[] files = downloadDir.listFiles();
            if (files != null && files.length > 0) {
                // Get the most recently modified file
                File latestFile = files[0];
                for (File file : files) {
                    if (file.lastModified() > latestFile.lastModified()) {
                        latestFile = file;
                    }
                }
                
                progress.setFilePath(latestFile.getName());
                progress.setStatus("completed");
                progress.setProgress(100);
            } else {
                progress.setStatus("error");
                progress.setError("No file was downloaded");
            }
            
        } catch (IOException | InterruptedException e) {
            logger.error("Download failed for ID: " + downloadId, e);
            progress.setStatus("error");
            progress.setError(e.getMessage());
        }
    }
    
    public DownloadProgress getDownloadProgress(String downloadId) {
        return downloadProgress.get(downloadId);
    }
    
    public void cleanupDownload(String downloadId) {
        downloadProgress.remove(downloadId);
    }
    
    private void createDownloadDirectory() throws IOException {
        Path dir = Paths.get(downloadDirectory);
        if (!Files.exists(dir)) {
            Files.createDirectories(dir);
        }
    }
    
    private ProcessBuilder createYtDlpProcess(String... args) {
        ProcessBuilder processBuilder = new ProcessBuilder();
        processBuilder.command().add(ytDlpCommand);
        for (String arg : args) {
            processBuilder.command().add(arg);
        }
        return processBuilder;
    }
} 