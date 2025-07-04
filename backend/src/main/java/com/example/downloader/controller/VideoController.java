package com.example.downloader.controller;

import com.example.downloader.dto.DownloadResponseDto;
import com.example.downloader.dto.VideoInfoDto;
import com.example.downloader.exception.VideoDownloadException;
import com.example.downloader.model.DownloadRequest;
import com.example.downloader.service.VideoDownloadService;
import com.example.downloader.service.VideoInfoService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://localhost:8080", "http://localhost:8081", "http://localhost:8082", "http://localhost:8085", "http://127.0.0.1:8080", "http://127.0.0.1:8081", "http://127.0.0.1:8082", "http://127.0.0.1:8085"})
public class VideoController {
    
    private static final Logger logger = LoggerFactory.getLogger(VideoController.class);
    
    @Autowired
    private VideoDownloadService downloadService;
    
    @Autowired
    private VideoInfoService infoService;
    
    @PostMapping("/videos/info")
    public ResponseEntity<VideoInfoDto> getVideoInfo(@RequestBody @Valid DownloadRequest request) {
        try {
            logger.info("Getting video info for URL: {}", request.getUrl());
            VideoInfoDto videoInfo = infoService.getVideoInfo(request.getUrl());
            return ResponseEntity.ok(videoInfo);
        } catch (VideoDownloadException e) {
            logger.error("Error getting video info: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Unexpected error getting video info", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PostMapping("/download")
    public ResponseEntity<DownloadResponseDto> downloadVideo(@RequestBody @Valid DownloadRequest request) {
        try {
            logger.info("Starting download for URL: {}, Format: {}, Quality: {}", 
                       request.getUrl(), request.getFormat(), request.getQuality());
            
            String downloadId = downloadService.downloadVideo(
                request.getUrl(), 
                request.getFormat(), 
                request.getQuality()
            );
            
            DownloadResponseDto response = new DownloadResponseDto("started", "Download started", downloadId);
            return ResponseEntity.ok(response);
            
        } catch (VideoDownloadException e) {
            logger.error("Download error: {}", e.getMessage());
            DownloadResponseDto response = new DownloadResponseDto("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            logger.error("Unexpected download error", e);
            DownloadResponseDto response = new DownloadResponseDto("error", "Internal server error");
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    @GetMapping("/download/status")
    public ResponseEntity<Map<String, Object>> getDownloadStatus(@RequestParam String id) {
        try {
            VideoDownloadService.DownloadProgress progress = downloadService.getDownloadProgress(id);
            if (progress == null) {
                return ResponseEntity.notFound().build();
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("state", progress.getStatus());
            response.put("progress", progress.getProgress());
            response.put("filePath", progress.getFilePath());
            response.put("error", progress.getError());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting download status", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/download")
    public ResponseEntity<Resource> downloadFile(
            @RequestParam String filename,
            @RequestParam(defaultValue = "false") boolean deleteAfter) {
        
        try {
            // Security check - prevent directory traversal
            if (filename.contains("..")) {
                return ResponseEntity.badRequest().build();
            }
            
            Path filePath = Paths.get("downloads", filename);
            File file = filePath.toFile();
            
            if (!file.exists() || !file.isFile()) {
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new FileSystemResource(file);
            
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
            headers.add(HttpHeaders.CONTENT_LENGTH, String.valueOf(file.length()));
            
            // Delete file after download if requested
            if (deleteAfter) {
                CompletableFuture.runAsync(() -> {
                    try {
                        Thread.sleep(1000); // Wait a bit to ensure download completes
                        Files.deleteIfExists(filePath);
                        logger.info("Deleted file after download: {}", filename);
                    } catch (Exception e) {
                        logger.error("Error deleting file: {}", filename, e);
                    }
                });
            }
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);
                    
        } catch (Exception e) {
            logger.error("Error serving file: {}", filename, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @DeleteMapping("/download/{filename}")
    public ResponseEntity<Void> deleteFile(@PathVariable String filename) {
        try {
            // Security check - prevent directory traversal
            if (filename.contains("..")) {
                return ResponseEntity.badRequest().build();
            }
            
            Path filePath = Paths.get("downloads", filename);
            boolean deleted = Files.deleteIfExists(filePath);
            
            if (deleted) {
                logger.info("Deleted file: {}", filename);
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build();
            }
            
        } catch (Exception e) {
            logger.error("Error deleting file: {}", filename, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/gallery")
    public ResponseEntity<Map<String, Object>> getGallery() {
        try {
            Path downloadsDir = Paths.get("downloads");
            if (!Files.exists(downloadsDir)) {
                Files.createDirectories(downloadsDir);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("files", Files.list(downloadsDir)
                    .filter(Files::isRegularFile)
                    .map(path -> {
                        Map<String, Object> fileInfo = new HashMap<>();
                        fileInfo.put("name", path.getFileName().toString());
                        fileInfo.put("size", path.toFile().length());
                        fileInfo.put("lastModified", path.toFile().lastModified());
                        fileInfo.put("downloadUrl", "/api/download?filename=" + path.getFileName().toString());
                        fileInfo.put("deleteUrl", "/api/download/" + path.getFileName().toString());
                        return fileInfo;
                    })
                    .toList());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting gallery", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "YouTube Downloader API");
        return ResponseEntity.ok(response);
    }
} 