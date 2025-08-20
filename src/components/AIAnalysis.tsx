import React, { useState } from 'react';
import { Brain, Video, FileText, Sparkles, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';

interface AIAnalysisProps {
  url: string;
  videoTitle?: string;
}

interface AnalysisResult {
  title: string;
  summary: string;
  keyPoints: string[];
  topics: string[];
  sentiment: string;
  duration: number;
  status: string;
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ url, videoTitle }) => {
  const [inputUrl, setInputUrl] = useState(url);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisType, setAnalysisType] = useState<'brief' | 'detailed' | 'comprehensive'>('detailed');
  const [summaryLength, setSummaryLength] = useState<'brief' | 'detailed' | 'comprehensive'>('detailed');
  const { toast } = useToast();

  const validateYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)/;
    return youtubeRegex.test(url);
  };

  const generateAnalysis = async () => {
    // Get the current URL and trim it
    const currentUrl = inputUrl.trim();
    
    if (!currentUrl || !validateYouTubeUrl(currentUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting AI analysis for URL:', currentUrl);

    setIsAnalyzing(true);
    try {
      const response = await axios.get(`http://localhost:8095/api/video/info?url=${encodeURIComponent(currentUrl)}`);

      console.log('AI Analysis response:', response.data);

      if (response.data) {
        // Transform the response to match the expected format
        const transformedResult = {
          title: response.data.title || 'Unknown Title',
          summary: response.data.aiSummary || '',
          keyPoints: response.data.keyPoints || [],
          topics: response.data.topics || [],
          sentiment: 'positive', // Default sentiment since our API doesn't provide it
          duration: response.data.duration || 0, // Use duration from backend
          status: 'completed'
        };
        
        setAnalysisResult(transformedResult);
        toast({
          title: "Analysis Complete",
          description: "AI analysis has been generated successfully",
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: "Failed to generate analysis",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('AI Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.response?.data?.error || error.response?.data?.message || "An error occurred during analysis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getSentimentColor = (sentiment?: string) => {
    if (!sentiment) return 'text-emerald-600 dark:text-emerald-400';
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      case 'neutral':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-emerald-600 dark:text-emerald-400';
    }
  };

  console.log('Analysis Result before render:', analysisResult);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2 text-slate-900 dark:text-white">
            <Brain className="w-6 h-6 text-emerald-600" />
            <span>AI Content Analysis</span>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              Gemini Pro
            </Badge>
          </CardTitle>
          <p className="text-slate-600 dark:text-slate-400">
            Powered by Google Gemini AI Pro for intelligent video content analysis
          </p>
        </CardHeader>
      </Card>

      {/* Input Section */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">Video URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-3">
            <Input
              type="url"
              placeholder="https://www.youtube.com/watch?v=... or https://youtube.com/shorts/..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={generateAnalysis}
              disabled={!inputUrl || isAnalyzing}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
            >
              {isAnalyzing ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>

          {/* Analysis Options */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Analysis Type
              </label>
              <Select value={analysisType} onValueChange={(value) => setAnalysisType(value as 'brief' | 'detailed' | 'comprehensive')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brief">Brief Summary</SelectItem>
                  <SelectItem value="detailed">Detailed Analysis</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Summary Length
              </label>
              <Select value={summaryLength} onValueChange={(value) => setSummaryLength(value as 'brief' | 'detailed' | 'comprehensive')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brief">Brief (2-3 sentences)</SelectItem>
                  <SelectItem value="detailed">Detailed (4-6 sentences)</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive (8-12 sentences)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysisResult && (
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Analysis Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="keypoints">Key Points</TabsTrigger>
                <TabsTrigger value="topics">Topics</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Content Summary</h3>
                  {analysisResult.summary.toLowerCase().includes('insufficient') || 
                   analysisResult.summary.toLowerCase().includes('limited') ||
                   analysisResult.summary.toLowerCase().includes('cannot') ||
                   analysisResult.summary.toLowerCase().includes('based on the video metadata') ||
                   analysisResult.summary.toLowerCase().includes('based on the video title') ||
                   analysisResult.summary.toLowerCase().includes('based on the youtube url') ? (
                    <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>Limited information available for analysis</span>
                      </p>
                    </div>
                  ) : null}
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {analysisResult.summary}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="keypoints" className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Key Points</h3>
                  <ul className="space-y-2">
                    {analysisResult.keyPoints && analysisResult.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="w-2 h-2 bg-emerald-600 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-slate-700 dark:text-slate-300">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="topics" className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Identified Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.topics && analysisResult.topics.map((topic, index) => (
                      <Badge key={index} variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="metadata" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Content Analysis</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Sentiment:</span>
                        <span className={`font-medium ${getSentimentColor(analysisResult.sentiment)}`}>
                          {analysisResult.sentiment}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Duration:</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {formatDuration(analysisResult.duration)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Status:</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {analysisResult.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Analysis Info</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Title:</span>
                        <span className="font-mono text-sm text-slate-900 dark:text-white">
                          {analysisResult.title}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Generated:</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {new Date().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Features Info */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <Brain className="w-8 h-8 mx-auto mb-2 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-semibold text-slate-900 dark:text-white">AI-Powered</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Gemini Pro integration</p>
        </div>
        <div className="text-center p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
          <FileText className="w-8 h-8 mx-auto mb-2 text-teal-600 dark:text-teal-400" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Smart Summaries</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Intelligent content analysis</p>
        </div>
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <Sparkles className="w-8 h-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Key Insights</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Extract important points</p>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysis;
