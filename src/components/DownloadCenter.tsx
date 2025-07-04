import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';

const DownloadCenter = () => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('');
  const [quality, setQuality] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [completedFile, setCompletedFile] = useState<{filename: string, filePath: string} | null>(null);
  const { toast } = useToast();

  const validateYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)/;
    return youtubeRegex.test(url);
  };

  const handleDownloadFile = async () => {
    if (!completedFile) return;
    
    try {
      const downloadUrl = `http://localhost:8095/api/download?filename=${encodeURIComponent(completedFile.filename)}`;
      console.log('Download URL:', downloadUrl); // Debug log
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = completedFile.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: "Download Started",
        description: `${completedFile.filename} is being downloaded`,
      });
      
      // Reset everything after download
      setUrl('');
      setFormat('');
      setQuality('');
      setDownloadProgress(0);
      setCompletedFile(null);
      setDownloadId(null);
      
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the file",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setUrl('');
    setFormat('');
    setQuality('');
    setDownloadProgress(0);
    setCompletedFile(null);
    setDownloadId(null);
    setIsDownloading(false);
  };

  const handleDownload = async () => {
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a YouTube URL",
        variant: "destructive",
      });
      return;
    }

    if (!validateYouTubeUrl(url)) {
      toast({
        title: "Invalid URL", 
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    if (!format) {
      toast({
        title: "Format Required",
        description: "Please select a format",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);
    setCompletedFile(null);
    setDownloadId(null);
    
    try {
      const res = await axios.post('http://localhost:8095/api/download', { url, format, quality });
      if (res.data.status === 'started' && res.data.download_id) {
        setDownloadId(res.data.download_id);
        toast({
          title: "Download Started!",
          description: "Your download is being processed. Watch the progress below.",
        });
        
        // Poll for download status
        const pollStatus = async () => {
          try {
            const statusRes = await axios.get(`http://localhost:8095/api/download/status?id=${res.data.download_id}`);
            const status = statusRes.data;
            
            // Update progress
            if (status.progress !== undefined) {
              setDownloadProgress(status.progress);
            }
            
            if (status.state === 'completed') {
              toast({
                title: "Download Complete!",
                description: "Your file is ready to download.",
              });
              
              // Set the filename directly (backend now returns just filename)
              if (status.filePath) {
                setCompletedFile({ filename: status.filePath, filePath: status.filePath });
              }
              
              setIsDownloading(false);
              setDownloadProgress(100);
            } else if (status.state === 'error') {
              toast({
                title: "Download Failed",
                description: status.error || "An error occurred during download",
                variant: "destructive",
              });
              setIsDownloading(false);
              setDownloadProgress(0);
              setDownloadId(null);
            } else {
              // Continue polling
              setTimeout(pollStatus, 2000);
            }
          } catch (error) {
            toast({
              title: "Status Check Failed",
              description: "Unable to check download status",
              variant: "destructive",
            });
            setIsDownloading(false);
            setDownloadProgress(0);
            setDownloadId(null);
          }
        };
        
        // Start polling
        setTimeout(pollStatus, 2000);
        
      } else {
        toast({
          title: "Download Failed",
          description: res.data.message || 'Unknown error',
          variant: "destructive",
        });
        setIsDownloading(false);
      }
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.response?.data?.message || error.message || "An error occurred while processing your request",
        variant: "destructive",
      });
      setIsDownloading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2 text-white text-2xl">
          <Download className="w-6 h-6" />
          <span>Download Center</span>
        </CardTitle>
        <p className="text-purple-100">Paste your YouTube URL and select your preferred format</p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            YouTube URL
          </label>
          <Input
            type="url"
            placeholder="https://www.youtube.com/watch?v="
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-purple-200 focus:border-white/40 focus:ring-white/20"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Format
            </label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-white/40">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent className="bg-purple-900 border-purple-700">
                <SelectItem value="video" className="text-white hover:bg-purple-800">MP4 Video</SelectItem>
                <SelectItem value="audio" className="text-white hover:bg-purple-800">MP3 Audio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Quality
            </label>
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-white/40">
                <SelectValue placeholder="Select format first" />
              </SelectTrigger>
              <SelectContent className="bg-purple-900 border-purple-700">
                {format === 'video' && (
                  <>
                    <SelectItem value="1080p" className="text-white hover:bg-purple-800">1080p HD</SelectItem>
                    <SelectItem value="720p" className="text-white hover:bg-purple-800">720p HD</SelectItem>
                    <SelectItem value="480p" className="text-white hover:bg-purple-800">480p</SelectItem>
                    <SelectItem value="360p" className="text-white hover:bg-purple-800">360p</SelectItem>
                  </>
                )}
                {format === 'audio' && (
                  <>
                    <SelectItem value="320" className="text-white hover:bg-purple-800">320 kbps</SelectItem>
                    <SelectItem value="256" className="text-white hover:bg-purple-800">256 kbps</SelectItem>
                    <SelectItem value="128" className="text-white hover:bg-purple-800">128 kbps</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Progress Bar */}
        {(isDownloading || downloadProgress > 0) && (
          <div className="w-full bg-white/10 rounded-lg p-4">
            <div className="flex justify-between text-white text-sm mb-2">
              <span>Download Progress</span>
              <span>{downloadProgress}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-red-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
            {isDownloading && (
              <p className="text-purple-200 text-xs mt-2 text-center">
                Downloading your video... Please wait
              </p>
            )}
          </div>
        )}
        
        {/* Download Button - Show when completed */}
        {completedFile && downloadProgress === 100 && (
          <div className="w-full bg-green-500/20 rounded-lg p-4 border border-green-500/30">
            <div className="text-center mb-4">
              <h3 className="text-white font-medium mb-2">✅ Download Complete!</h3>
              <p className="text-green-200 text-sm">{completedFile.filename}</p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={handleDownloadFile}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 h-auto text-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Download className="w-5 h-5 mr-2" />
                Download File
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="bg-transparent border-white/30 text-white hover:bg-white/10"
              >
                New Download
              </Button>
            </div>
          </div>
        )}
        
        {/* Start Download Button - Show when not downloading */}
        {!isDownloading && !completedFile && (
          <Button
            onClick={handleDownload}
            disabled={!url || !format || !quality}
            className="w-full bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white py-3 h-auto text-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5 mr-2" />
            Start Download
          </Button>
        )}
        
        {/* Processing Button - Show when downloading */}
        {isDownloading && (
          <Button
            disabled
            className="w-full bg-gray-600 text-white py-3 h-auto text-lg font-medium transition-all duration-200 shadow-lg opacity-75 cursor-not-allowed"
          >
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processing...
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default DownloadCenter;
