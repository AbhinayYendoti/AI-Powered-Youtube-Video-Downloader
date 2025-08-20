import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Download, Video, Music, Settings, Info, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface QualitySelectorProps {
  onQualitySelected: (format: 'video' | 'audio', quality: string) => void;
  isLoading?: boolean;
  url?: string;
}

interface VideoFormat {
  format_id: string;
  ext: string;
  resolution: string;
  fps?: number;
  filesize?: number;
  vcodec?: string;
  acodec?: string;
}

interface AudioFormat {
  format_id: string;
  ext: string;
  abr?: number;
  filesize?: number;
  acodec?: string;
}

const QualitySelector: React.FC<QualitySelectorProps> = ({ onQualitySelected, isLoading = false, url }) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('video');
  const [selectedQuality, setSelectedQuality] = useState<string>('1080p');
  const [selectedAudioFormat, setSelectedAudioFormat] = useState<string>('mp3');
  const [selectedBitrate, setSelectedBitrate] = useState<string>('320');
  const [availableQualities, setAvailableQualities] = useState<VideoFormat[]>([]);
  const [availableAudioFormats, setAvailableAudioFormats] = useState<AudioFormat[]>([]);
  const [isLoadingQualities, setIsLoadingQualities] = useState(false);
  const [qualitiesError, setQualitiesError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAvailableQualities = async () => {
    if (!url) return;
    
    setIsLoadingQualities(true);
    setQualitiesError(null);
    
    try {
      const response = await axios.post('http://localhost:8095/api/videos/qualities', {
        url: url
      });
      
      if (response.data.video_formats) {
        setAvailableQualities(response.data.video_formats);
      }
      if (response.data.audio_formats) {
        setAvailableAudioFormats(response.data.audio_formats);
      }
      
      toast({
        title: "Qualities Loaded",
        description: "Available video qualities have been fetched successfully",
      });
    } catch (error: any) {
      console.error('Error fetching qualities:', error);
      setQualitiesError(error.response?.data?.error || 'Failed to fetch available qualities');
      toast({
        title: "Quality Fetch Failed",
        description: error.response?.data?.error || "Failed to fetch available qualities",
        variant: "destructive",
      });
    } finally {
      setIsLoadingQualities(false);
    }
  };

  useEffect(() => {
    if (url) {
      fetchAvailableQualities();
    }
  }, [url]);

  const getQualityOptions = () => {
    if (availableQualities.length > 0) {
      return availableQualities.map(format => ({
        value: format.resolution || format.format_id,
        label: format.resolution || `${format.ext.toUpperCase()}`,
        description: `${format.ext.toUpperCase()} • ${format.vcodec || 'Unknown codec'}`,
        icon: getQualityIcon(format.resolution),
        filesize: format.filesize
      }));
    }
    
    return [
      { value: '4K', label: '4K Ultra HD', description: '3840x2160', icon: '🎬' },
      { value: '1440p', label: '2K QHD', description: '2560x1440', icon: '📺' },
      { value: '1080p', label: 'Full HD', description: '1920x1080', icon: '🎥' },
      { value: '720p', label: 'HD Ready', description: '1280x720', icon: '📱' },
      { value: '480p', label: 'SD', description: '854x480', icon: '📺' },
      { value: '360p', label: 'Low Quality', description: '640x360', icon: '📱' }
    ];
  };

  const getQualityIcon = (resolution?: string) => {
    if (!resolution) return '📱';
    if (resolution.includes('2160') || resolution.includes('4K')) return '🎬';
    if (resolution.includes('1440')) return '📺';
    if (resolution.includes('1080')) return '🎥';
    if (resolution.includes('720')) return '📱';
    return '📺';
  };

  const getAudioFormatOptions = () => {
    if (availableAudioFormats.length > 0) {
      return availableAudioFormats.map(format => ({
        value: format.ext,
        label: format.ext.toUpperCase(),
        description: `${format.abr || 'Unknown'} kbps • ${format.acodec || 'Unknown codec'}`,
        icon: getAudioIcon(format.ext),
        filesize: format.filesize
      }));
    }
    
    return [
      { value: 'mp3', label: 'MP3', description: 'Most compatible', icon: '🎵' },
      { value: 'm4a', label: 'M4A', description: 'High quality', icon: '🎶' },
      { value: 'wav', label: 'WAV', description: 'Lossless', icon: '🎼' },
      { value: 'flac', label: 'FLAC', description: 'Compressed lossless', icon: '🎧' },
      { value: 'ogg', label: 'OGG', description: 'Open format', icon: '🎤' },
      { value: 'aac', label: 'AAC', description: 'Apple format', icon: '🍎' }
    ];
  };

  const getAudioIcon = (ext: string) => {
    switch (ext.toLowerCase()) {
      case 'mp3': return '🎵';
      case 'm4a': return '🎶';
      case 'wav': return '🎼';
      case 'flac': return '🎧';
      case 'ogg': return '🎤';
      case 'aac': return '🍎';
      default: return '🎵';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getBitrateOptions = () => [
    { value: '320', label: '320 kbps', description: 'High quality' },
    { value: '256', label: '256 kbps', description: 'Good quality' },
    { value: '192', label: '192 kbps', description: 'Standard quality' },
    { value: '128', label: '128 kbps', description: 'Basic quality' },
    { value: '96', label: '96 kbps', description: 'Low quality' }
  ];

  const handleDownload = () => {
    if (selectedFormat === 'video') {
      onQualitySelected('video', selectedQuality);
    } else {
      onQualitySelected('audio', selectedBitrate);
    }
  };

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {isLoadingQualities && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-3 text-blue-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Fetching available qualities...</span>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Error State */}
      {qualitiesError && (
        <Card className="border-0 shadow-lg border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Failed to load qualities</p>
                <p className="text-xs text-red-500 mt-1">{qualitiesError}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={fetchAvailableQualities}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Format Selection */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-t-lg">
          <CardTitle className="flex items-center justify-between text-slate-900 dark:text-white">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <span>Format Selection</span>
            </div>
            {url && (
              <Badge variant="secondary" className="text-xs">
                {availableQualities.length > 0 ? `${availableQualities.length} qualities` : 'Default options'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={selectedFormat === 'video' ? 'default' : 'outline'}
              className={`h-24 flex flex-col items-center justify-center space-y-2 transition-all duration-200 ${
                selectedFormat === 'video' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg transform scale-105' 
                  : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 hover:shadow-md'
              }`}
              onClick={() => setSelectedFormat('video')}
            >
              <Video className="w-7 h-7" />
              <span className="font-semibold">Video</span>
              <span className="text-xs opacity-80">With audio track</span>
              {selectedFormat === 'video' && <CheckCircle className="w-4 h-4 absolute top-2 right-2" />}
            </Button>
            <Button
              variant={selectedFormat === 'audio' ? 'default' : 'outline'}
              className={`h-24 flex flex-col items-center justify-center space-y-2 transition-all duration-200 relative ${
                selectedFormat === 'audio' 
                  ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white border-0 shadow-lg transform scale-105' 
                  : 'hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 hover:shadow-md'
              }`}
              onClick={() => setSelectedFormat('audio')}
            >
              <Music className="w-7 h-7" />
              <span className="font-semibold">Audio Only</span>
              <span className="text-xs opacity-80">Extract audio</span>
              {selectedFormat === 'audio' && <CheckCircle className="w-4 h-4 absolute top-2 right-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quality Selection */}
      {selectedFormat === 'video' && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
              <Video className="w-5 h-5 text-purple-600" />
              <span>Video Quality</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {getQualityOptions().map((option) => (
                <Button
                  key={option.value}
                  variant={selectedQuality === option.value ? 'default' : 'outline'}
                  className={`h-16 flex flex-col items-center justify-center space-y-1 ${
                    selectedQuality === option.value 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0' 
                      : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'
                  }`}
                  onClick={() => setSelectedQuality(option.value)}
                >
                  <span className="text-lg">{option.icon}</span>
                  <span className="font-semibold text-sm">{option.label}</span>
                  <span className="text-xs opacity-80">{option.description}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audio Format Selection */}
      {selectedFormat === 'audio' && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20">
            <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
              <Music className="w-5 h-5 text-green-600" />
              <span>Audio Format</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {getAudioFormatOptions().map((option) => (
                <Button
                  key={option.value}
                  variant={selectedAudioFormat === option.value ? 'default' : 'outline'}
                  className={`h-16 flex flex-col items-center justify-center space-y-1 ${
                    selectedAudioFormat === option.value 
                      ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white border-0' 
                      : 'hover:bg-green-50 dark:hover:bg-green-900/20'
                  }`}
                  onClick={() => setSelectedAudioFormat(option.value)}
                >
                  <span className="text-lg">{option.icon}</span>
                  <span className="font-semibold text-sm">{option.label}</span>
                  <span className="text-xs opacity-80">{option.description}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bitrate Selection for Audio */}
      {selectedFormat === 'audio' && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
            <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
              <Settings className="w-5 h-5 text-orange-600" />
              <span>Audio Quality</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {getBitrateOptions().map((option) => (
                <Button
                  key={option.value}
                  variant={selectedBitrate === option.value ? 'default' : 'outline'}
                  className={`h-12 flex flex-col items-center justify-center space-y-1 ${
                    selectedBitrate === option.value 
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white border-0' 
                      : 'hover:bg-orange-50 dark:hover:bg-orange-900/20'
                  }`}
                  onClick={() => setSelectedBitrate(option.value)}
                >
                  <span className="font-semibold text-sm">{option.label}</span>
                  <span className="text-xs opacity-80">{option.description}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quality Information */}
      <Card className="border-0 shadow-lg bg-blue-50 dark:bg-blue-900/20">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900 dark:text-white">Quality Information</h4>
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                {selectedFormat === 'video' ? (
                  <>
                    <p>• Selected quality: <Badge variant="secondary">{selectedQuality}</Badge></p>
                    <p>• Format: MP4 with H.264 codec</p>
                    <p>• Audio: AAC 128kbps included</p>
                  </>
                ) : (
                  <>
                    <p>• Selected format: <Badge variant="secondary">{selectedAudioFormat.toUpperCase()}</Badge></p>
                    <p>• Bitrate: <Badge variant="secondary">{selectedBitrate} kbps</Badge></p>
                    <p>• Quality: {selectedBitrate === '320' ? 'High' : selectedBitrate === '256' ? 'Good' : 'Standard'}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Button */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <Button
            onClick={handleDownload}
            disabled={isLoading}
            className="w-full h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Download {selectedFormat === 'video' ? selectedQuality : selectedAudioFormat.toUpperCase()}</span>
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default QualitySelector;
