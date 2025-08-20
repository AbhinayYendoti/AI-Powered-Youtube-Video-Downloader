import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';

const DownloadCenter: React.FC = () => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('');
  const [quality, setQuality] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState<string | null>(null);
  const [downloadEta, setDownloadEta] = useState<string | null>(null);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [completedFile, setCompletedFile] = useState<{filename: string, filePath: string} | null>(null);
  const { toast } = useToast();

  const validateYouTubeUrl = (url: string) => {
    // More comprehensive regex that handles various YouTube URL formats including Shorts
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)[a-zA-Z0-9_-]+(\?.*)?$/;
    return youtubeRegex.test(url);
  };

  const handleDownloadFile = async () => {
    if (!completedFile || !downloadId) return;
    
    try {
      // Use download_id only, let backend handle the filename
      const downloadUrl = `http://localhost:8095/api/download?download_id=${downloadId}`;
      console.log('Download URL:', downloadUrl); // Debug log
      
      // Method 1: Try using window.open to force download popup
      try {
        window.open(downloadUrl, '_blank');
      } catch (openError) {
        console.log('Window.open failed, trying direct link...');
        
        // Method 2: Create and click a link
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = completedFile.filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      toast({
        title: "Download Started",
        description: `${completedFile.filename} is being downloaded to your system's download folder`,
      });
      
      // Trigger gallery refresh immediately when download starts
      window.dispatchEvent(new CustomEvent('download-complete'));
      
      // Clean up the temporary file from backend after a short delay
      setTimeout(async () => {
        try {
          await axios.post('http://localhost:8095/api/download/cleanup', {
            download_id: downloadId,
            filename: completedFile.filename
          });
          console.log('Temporary file cleaned up from backend');
          
          // Trigger gallery refresh after cleanup
          window.dispatchEvent(new CustomEvent('download-complete'));
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }, 3000); // Wait 3 seconds before cleanup
      
      // Reset everything after download
      setUrl('');
      setFormat('');
      setQuality('');
      setDownloadProgress(0);
      setCompletedFile(null);
      setDownloadId(null);
      
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setUrl('');
    setFormat('');
    setQuality('');
    setDownloadProgress(0);
    setDownloadSpeed(null);
    setDownloadEta(null);
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
    setDownloadSpeed(null);
    setDownloadEta(null);
    setCompletedFile(null);
    setDownloadId(null);
    
    try {
      // Clean the URL by removing any parameters after '?si='
      const cleanUrl = url.split('?si=')[0];
      console.log('Downloading URL:', cleanUrl);
      
      const res = await axios.post('http://localhost:8095/api/download', { url: cleanUrl, format, quality });
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
            
            // Update progress and additional info
            if (status.progress !== undefined) {
              setDownloadProgress(status.progress);
            }
            if (status.speed) {
              setDownloadSpeed(status.speed);
            }
            if (status.eta) {
              setDownloadEta(status.eta);
            }
            
            if (status.state === 'done') {
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
              
              // Trigger gallery refresh
              window.dispatchEvent(new CustomEvent('download-complete'));
            } else if (status.state === 'error') {
              toast({
                title: "Download Failed",
                description: status.error || "An error occurred during download",
                variant: "destructive",
              });
              setIsDownloading(false);
              setDownloadProgress(0);
              setDownloadSpeed(null);
              setDownloadEta(null);
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
            setDownloadSpeed(null);
            setDownloadEta(null);
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
    <>
    <Card className="max-w-4xl mx-auto bg-gradient-to-br from-gray-50/95 via-blue-50/95 to-indigo-50/95 backdrop-blur-xl border-gray-200/50 shadow-2xl rounded-2xl">
      <CardHeader className="text-center pb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Download className="w-7 h-7 text-white" />
          </div>
          <div>
            <CardTitle className="text-gray-800 text-3xl font-bold">
              Download Center
        </CardTitle>
            <p className="text-gray-600 text-sm mt-1">Professional YouTube Video Downloader</p>
          </div>
        </div>
        <p className="text-gray-700 text-base">Paste your YouTube URL (videos or Shorts) and select your preferred format & quality</p>
      </CardHeader>
      
      <CardContent className="space-y-8 px-8 pb-8">
        {/* URL Input Section */}
        <div className="space-y-3">
          <label className="block text-gray-700 text-sm font-semibold mb-2 flex items-center">
            <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
            YouTube URL
          </label>
                      <Input
              type="url"
              placeholder="https://www.youtube.com/watch?v=... or https://youtube.com/shorts/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-white/80 border-gray-300/50 text-gray-800 placeholder:text-gray-500 focus:border-indigo-400 focus:ring-indigo-200 w-full h-12 text-base rounded-xl transition-all duration-200"
            />
        </div>

        {/* Format & Quality Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="block text-gray-700 text-sm font-semibold mb-2 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Format
            </label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="bg-white/80 border-gray-300/50 text-gray-800 focus:border-blue-400 focus:ring-blue-200 h-12 rounded-xl transition-all duration-200">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 rounded-xl">
                <SelectItem value="video" className="text-gray-800 hover:bg-blue-50 focus:bg-blue-50">📹 MP4 Video</SelectItem>
                <SelectItem value="audio" className="text-gray-800 hover:bg-blue-50 focus:bg-blue-50">🎵 MP3 Audio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="block text-gray-700 text-sm font-semibold mb-2 flex items-center">
              <div className="w-2 h-2 bg-teal-500 rounded-full mr-2"></div>
              Quality
            </label>
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger className="bg-white/80 border-gray-300/50 text-gray-800 focus:border-teal-400 focus:ring-teal-200 h-12 rounded-xl transition-all duration-200">
                <SelectValue placeholder="Select format first" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 rounded-xl">
                {format === 'video' && (
                  <>
                    <SelectItem value="4k" className="text-gray-800 hover:bg-teal-50 focus:bg-teal-50">🎬 4K Ultra HD (2160p)</SelectItem>
                    <SelectItem value="1080p" className="text-gray-800 hover:bg-teal-50 focus:bg-teal-50">🎥 1080p Full HD</SelectItem>
                    <SelectItem value="720p" className="text-gray-800 hover:bg-teal-50 focus:bg-teal-50">📺 720p HD</SelectItem>
                    <SelectItem value="480p" className="text-gray-800 hover:bg-teal-50 focus:bg-teal-50">📱 480p</SelectItem>
                    <SelectItem value="360p" className="text-gray-800 hover:bg-teal-50 focus:bg-teal-50">📟 360p</SelectItem>
                  </>
                )}
                {format === 'audio' && (
                  <>
                    <SelectItem value="320" className="text-gray-800 hover:bg-teal-50 focus:bg-teal-50">🎧 320 kbps (High Quality)</SelectItem>
                    <SelectItem value="256" className="text-gray-800 hover:bg-teal-50 focus:bg-teal-50">🎵 256 kbps (Good Quality)</SelectItem>
                    <SelectItem value="128" className="text-gray-800 hover:bg-teal-50 focus:bg-teal-50">📻 128 kbps (Standard)</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Progress Bar */}
        {(isDownloading || downloadProgress > 0) && (
          <div className="w-full bg-white/60 rounded-2xl p-6 border border-gray-200/50">
            <div className="flex justify-between text-gray-700 text-sm mb-3">
              <span className="font-medium">Download Progress</span>
              <span className="font-bold text-gray-800">{downloadProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200/50 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 via-blue-500 to-teal-500 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
            {isDownloading && (
              <div className="mt-3 text-center">
                <p className="text-gray-600 text-sm font-medium mb-2">
                  ⏳ Downloading your {format === 'video' ? 'video' : 'audio'}...
                </p>
                {(downloadSpeed || downloadEta) && (
                  <div className="flex justify-center space-x-4 text-xs text-gray-500">
                    {downloadSpeed && (
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        Speed: {downloadSpeed}
                      </span>
                    )}
                    {downloadEta && (
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                        ETA: {downloadEta}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Download Complete Section */}
        {completedFile && downloadProgress === 100 && (
          <div className="w-full bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200/50 backdrop-blur-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-gray-800 font-bold text-xl mb-2">Download Complete!</h3>
              <p className="text-green-700 text-sm font-medium">{completedFile.filename}</p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={handleDownloadFile}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 h-auto text-lg font-bold transition-all duration-200 shadow-lg hover:shadow-xl rounded-xl"
              >
                <Download className="w-6 h-6 mr-3" />
                Download File
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-800 py-4 h-auto text-lg font-medium transition-all duration-200 rounded-xl"
              >
                New Download
              </Button>
            </div>
          </div>
        )}
        
        {/* Start Download Button */}
        {!isDownloading && !completedFile && (
          <Button
            onClick={handleDownload}
            disabled={!url || !format || !quality}
            className="w-full bg-gradient-to-r from-indigo-500 via-blue-600 to-teal-600 hover:from-indigo-600 hover:via-blue-700 hover:to-teal-700 text-white py-4 h-auto text-xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-6 h-6 mr-3" />
            Start Download
          </Button>
        )}
        
        {/* Processing Button */}
        {isDownloading && (
          <Button
            disabled
            className="w-full bg-gray-400 text-gray-600 py-4 h-auto text-xl font-bold transition-all duration-200 shadow-lg opacity-75 cursor-not-allowed rounded-2xl"
          >
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mr-3"></div>
            Processing Download...
          </Button>
        )}
      </CardContent>
    </Card>
  </>
  );
};

export default DownloadCenter;
