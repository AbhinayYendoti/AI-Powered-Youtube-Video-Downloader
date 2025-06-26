
import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const DownloadCenter = () => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('');
  const [quality, setQuality] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const validateYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)/;
    return youtubeRegex.test(url);
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
    
    try {
      // Simulate API call - replace with actual backend integration
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Download Started!",
        description: "Your video download has been initiated",
      });
      
      // Reset form
      setUrl('');
      setFormat('');
      setQuality('');
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "An error occurred while processing your request",
        variant: "destructive",
      });
    } finally {
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
                <SelectItem value="mp4" className="text-white hover:bg-purple-800">MP4 Video</SelectItem>
                <SelectItem value="mp3" className="text-white hover:bg-purple-800">MP3 Audio</SelectItem>
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
                {format === 'mp4' && (
                  <>
                    <SelectItem value="1080p" className="text-white hover:bg-purple-800">1080p HD</SelectItem>
                    <SelectItem value="720p" className="text-white hover:bg-purple-800">720p HD</SelectItem>
                    <SelectItem value="480p" className="text-white hover:bg-purple-800">480p</SelectItem>
                    <SelectItem value="360p" className="text-white hover:bg-purple-800">360p</SelectItem>
                  </>
                )}
                {format === 'mp3' && (
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

        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white py-3 h-auto text-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Download className="w-5 h-5 mr-2" />
          {isDownloading ? 'Processing...' : 'Start Download'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DownloadCenter;
