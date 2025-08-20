import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Video, 
  Music, 
  Brain, 
  Sparkles, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Link,
  Settings,
  FileVideo,
  FileAudio,
  Zap,
  Globe,
  Star,
  TrendingUp
} from 'lucide-react';
import axios from 'axios';

interface VideoInfo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  uploader: string;
  url: string;
}

interface DownloadProgress {
  id: string;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  progress: number;
  filePath?: string;
  error?: string;
  startTime: number;
}

interface AnalysisResult {
  id: string;
  status: string;
  summary: string;
  keyPoints: string[];
  topics: string[];
  sentiment: string;
  videoTitle: string;
  duration: string;
  language: string;
}

const ModernDownloader: React.FC = () => {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'video' | 'audio'>('video');
  const [selectedQuality, setSelectedQuality] = useState('1080p');
  const [analysisType, setAnalysisType] = useState('detailed');
  const [activeTab, setActiveTab] = useState('download');
  const { toast } = useToast();

  const validateYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const analyzeVideo = async () => {
    if (!url || !validateYouTubeUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingVideo(true);
    try {
      const response = await axios.post('http://localhost:8080/api/videos/info', { url });
      setVideoInfo(response.data);
      toast({
        title: "Video Analyzed",
        description: "Video information loaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.response?.data?.message || "Could not analyze video",
        variant: "destructive",
      });
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const startDownload = async () => {
    if (!url || !validateYouTubeUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    const downloadId = `download_${Date.now()}`;
    setDownloadProgress({
      id: downloadId,
      status: 'pending',
      progress: 0,
      startTime: Date.now()
    });

    try {
      const endpoint = selectedFormat === 'audio' ? '/api/download/audio' : '/api/download';
      const response = await axios.post(`http://localhost:8080${endpoint}`, {
        url,
        format: selectedFormat,
        quality: selectedQuality
      });

      if (response.data.download_id || response.data.downloadId) {
        const actualDownloadId = response.data.download_id || response.data.downloadId;
        setDownloadProgress(prev => prev ? { ...prev, id: actualDownloadId, status: 'downloading' } : null);
        pollDownloadProgress(actualDownloadId);
      }

      toast({
        title: "Download Started",
        description: `${selectedFormat === 'audio' ? 'Audio' : 'Video'} download has begun`,
      });
    } catch (error: any) {
      setDownloadProgress(prev => prev ? { ...prev, status: 'error', error: error.response?.data?.message || 'Download failed' } : null);
      toast({
        title: "Download Failed",
        description: error.response?.data?.message || "Could not start download",
        variant: "destructive",
      });
    }
  };

  const pollDownloadProgress = async (downloadId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/download/status?id=${downloadId}`);
        const progress = response.data;
        console.log('Download progress update:', progress);
        
        setDownloadProgress(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status: progress.state || progress.status,
            progress: progress.progress || 0,
            filePath: progress.filePath,
            error: progress.error
          };
        });

        if (progress.state === 'completed' || progress.status === 'completed') {
          clearInterval(pollInterval);
          toast({
            title: "Download Complete",
            description: "Your file is ready for download",
          });
        } else if (progress.state === 'error' || progress.status === 'error') {
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Error polling download progress:', error);
      }
    }, 1000);

    // Clear interval after 10 minutes
    setTimeout(() => clearInterval(pollInterval), 600000);
  };

  const generateAIAnalysis = async () => {
    if (!url || !validateYouTubeUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await axios.post('http://localhost:8095/api/analysis/generate', {
        url: url,
        analysis_type: analysisType,
        summary_length: 'detailed',
        include_key_points: true,
        include_topics: true,
        include_sentiment: true
      });

      if (response.data.status === 'completed') {
        setAnalysisResult(response.data);
        toast({
          title: "Analysis Complete",
          description: "AI analysis has been generated successfully",
        });
      } else {
        toast({
          title: "Analysis Processing",
          description: "AI analysis is being processed...",
        });
      }
    } catch (error: any) {
      console.error('AI Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.response?.data?.error || "An error occurred during analysis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAll = () => {
    setUrl('');
    setVideoInfo(null);
    setDownloadProgress(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
    setIsLoadingVideo(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'downloading':
      case 'pending':
        return <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />;
      default:
        return <Loader2 className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'neutral':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl shadow-lg">
              <Video className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
            ClipCaster Pro
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Professional YouTube downloader with AI-powered content analysis. Download videos, extract audio, and get intelligent insights.
          </p>
        </div>

        {/* URL Input Section */}
        <Card className="mb-8 border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
              <Link className="w-5 h-5 text-emerald-600" />
              <span>Enter YouTube URL</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <Input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-12 h-12 text-lg border-2 border-slate-200 focus:border-emerald-500 rounded-xl"
                  onKeyPress={(e) => e.key === 'Enter' && analyzeVideo()}
                />
                <Globe className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              </div>
              <Button
                onClick={analyzeVideo}
                disabled={!url || isLoadingVideo}
                className="h-12 px-6 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 rounded-xl shadow-lg"
              >
                {isLoadingVideo ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Video Info Display */}
        {videoInfo && (
          <Card className="mb-8 border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
                <div className="md:w-1/3">
                  <img
                    src={videoInfo.thumbnail}
                    alt={videoInfo.title}
                    className="w-full rounded-xl shadow-lg"
                  />
                </div>
                <div className="md:w-2/3 space-y-3">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-2">
                    {videoInfo.title}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                      <Video className="w-3 h-3 mr-1" />
                      {Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toString().padStart(2, '0')}
                    </Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Star className="w-3 h-3 mr-1" />
                      {videoInfo.uploader}
                    </Badge>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 line-clamp-3">
                    {videoInfo.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                      <TabsList className="grid w-full grid-cols-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-1 shadow-lg">
            <TabsTrigger 
              value="download" 
              className="flex items-center space-x-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analysis" 
              className="flex items-center space-x-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
            >
              <Brain className="w-4 h-4" />
              <span>AI Analysis</span>
            </TabsTrigger>
          </TabsList>

          {/* Download Tab */}
          <TabsContent value="download" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
                  <Settings className="w-5 h-5 text-emerald-600" />
                  <span>Download Options</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Format Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Format</label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={selectedFormat === 'video' ? 'default' : 'outline'}
                      className={`h-16 flex flex-col items-center justify-center space-y-2 ${
                        selectedFormat === 'video' 
                                          ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-lg'
                : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300'
                      }`}
                      onClick={() => setSelectedFormat('video')}
                    >
                      <FileVideo className="w-6 h-6" />
                      <span className="font-semibold">Video</span>
                    </Button>
                    <Button
                      variant={selectedFormat === 'audio' ? 'default' : 'outline'}
                      className={`h-16 flex flex-col items-center justify-center space-y-2 ${
                        selectedFormat === 'audio' 
                          ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white border-0 shadow-lg' 
                          : 'hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300'
                      }`}
                      onClick={() => setSelectedFormat('audio')}
                    >
                      <FileAudio className="w-6 h-6" />
                      <span className="font-semibold">Audio Only</span>
                    </Button>
                  </div>
                </div>

                {/* Quality Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Quality</label>
                  <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                    <SelectTrigger className="h-12 border-2 border-slate-200 focus:border-emerald-500 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedFormat === 'video' ? (
                        <>
                          <SelectItem value="4K">4K Ultra HD (2160p)</SelectItem>
                          <SelectItem value="1440p">2K QHD (1440p)</SelectItem>
                          <SelectItem value="1080p">Full HD (1080p)</SelectItem>
                          <SelectItem value="720p">HD (720p)</SelectItem>
                          <SelectItem value="480p">SD (480p)</SelectItem>
                          <SelectItem value="best">Best Available</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="320">320 kbps (High Quality)</SelectItem>
                          <SelectItem value="256">256 kbps (Good Quality)</SelectItem>
                          <SelectItem value="192">192 kbps (Standard)</SelectItem>
                          <SelectItem value="128">128 kbps (Basic)</SelectItem>
                          <SelectItem value="best">Best Available</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Download Button */}
                <Button
                  onClick={startDownload}
                  disabled={!url || !validateYouTubeUrl(url) || downloadProgress?.status === 'downloading'}
                  className="w-full h-14 text-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 rounded-xl shadow-lg"
                >
                  {downloadProgress?.status === 'downloading' ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Download {selectedFormat === 'audio' ? 'Audio' : 'Video'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Download Progress */}
            {downloadProgress && (
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
                    {getStatusIcon(downloadProgress.status)}
                    <span>Download Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {downloadProgress.status === 'downloading' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                        <span>Progress</span>
                        <span>{downloadProgress.progress}%</span>
                      </div>
                      <Progress value={downloadProgress.progress} className="w-full h-2" />
                    </div>
                  )}
                  
                  {downloadProgress.status === 'completed' && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Download completed successfully!</span>
                      </div>
                      <div className="flex space-x-3">
                        <Button
                          onClick={resetAll}
                          variant="outline"
                          className="flex-1"
                        >
                          Download Another
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {downloadProgress.status === 'error' && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">Error: {downloadProgress.error}</span>
                      </div>
                      <Button
                        onClick={resetAll}
                        variant="outline"
                        className="w-full"
                      >
                        Try Again
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* AI Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
                  <Brain className="w-5 h-5 text-green-600" />
                  <span>AI Content Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Analysis Type Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Analysis Type</label>
                  <Select value={analysisType} onValueChange={setAnalysisType}>
                    <SelectTrigger className="h-12 border-2 border-slate-200 focus:border-green-500 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brief">Brief Summary</SelectItem>
                      <SelectItem value="detailed">Detailed Analysis</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Generate Analysis Button */}
                <Button
                  onClick={generateAIAnalysis}
                  disabled={!url || !validateYouTubeUrl(url) || isAnalyzing}
                  className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 rounded-xl shadow-lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate AI Analysis
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysisResult && (
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-slate-900 dark:text-white">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span>Analysis Results</span>
                    </div>
                    <Badge className={getSentimentColor(analysisResult.sentiment)}>
                      {analysisResult.sentiment}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Summary */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white">Summary</h4>
                    <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {analysisResult.summary}
                      </p>
                    </div>
                  </div>

                  {/* Key Points */}
                  {analysisResult.keyPoints && analysisResult.keyPoints.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-900 dark:text-white">Key Points</h4>
                      <div className="space-y-2">
                        {analysisResult.keyPoints.map((point, index) => (
                                          <div key={index} className="flex items-start space-x-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                              {index + 1}
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 flex-1">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Topics */}
                  {analysisResult.topics && analysisResult.topics.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-900 dark:text-white">Topics</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.topics.map((topic, index) => (
                          <Badge key={index} variant="secondary" className="bg-teal-100 text-teal-800">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Features Showcase */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
                          <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-2xl">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Video className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">4K Support</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Download videos up to 4K Ultra HD resolution</p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">AI Analysis</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Powered by Google Gemini Pro AI</p>
          </div>
                          <div className="text-center p-6 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-2xl">
                  <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Lightning Fast</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Optimized for speed and reliability</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDownloader;
