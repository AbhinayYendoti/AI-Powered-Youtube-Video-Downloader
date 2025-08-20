import React, { useState } from 'react';
import { Download, Brain, Settings, Video, Music, Sparkles, Zap, Shield } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DownloadCenter from '@/components/DownloadCenter';
import Gallery from '@/components/Gallery';
import AIAnalysis from '@/components/AIAnalysis';

const Index = () => {
  const [activeTab, setActiveTab] = useState('download');

  const features = [
    {
      icon: <Video className="w-6 h-6" />,
      title: "4K Video Downloads",
      description: "Download videos up to 4K resolution with multiple format options",
      badge: "New"
    },
    {
      icon: <Music className="w-6 h-6" />,
      title: "Audio Extraction",
      description: "Extract high-quality audio in MP3, M4A, and WAV formats",
      badge: "Enhanced"
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI Content Analysis",
      description: "Powered by Gemini AI Pro for intelligent video summaries",
      badge: "AI-Powered"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Optimized processing with parallel downloads and caching",
      badge: "Optimized"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Private",
      description: "No data storage, direct downloads with privacy protection",
      badge: "Secure"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Professional Quality",
      description: "Advanced codec support and quality optimization",
      badge: "Pro"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-10 h-7 text-white" fill="currentColor" viewBox="0 0 176 124" xmlns="http://www.w3.org/2000/svg">
                  <path d="M172.32 19.36c-2.02-7.58-7.96-13.52-15.54-15.54C143.04 0 88 0 88 0S32.96 0 19.22 3.82C11.64 5.84 5.7 11.78 3.68 19.36 0 33.1 0 62 0 62s0 28.9 3.68 42.64c2.02 7.58 7.96 13.52 15.54 15.54C32.96 124 88 124 88 124s55.04 0 68.78-3.82c7.58-2.02 13.52-7.96 15.54-15.54C176 90.9 176 62 176 62s0-28.9-3.68-42.64zM70 88.17V35.83L116 62 70 88.17z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">YouTube Video Downloader</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Download videos in high quality</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-6 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>4K Support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>3 Audio Formats</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>AI Powered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Download YouTube Videos
              <span className="block text-red-600 dark:text-red-400">in High Quality</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
              Experience the next generation of video downloading with 4K support, AI-powered analysis, 
              and professional audio extraction capabilities. Supports both regular videos and YouTube Shorts.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">4K</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Max Resolution</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">6+</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Audio Formats</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">AI</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Powered Analysis</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-1">
              <TabsTrigger 
                value="download" 
                className="flex items-center justify-center space-x-1 data-[state=active]:bg-red-600 data-[state=active]:text-white px-2 py-2 rounded-xl text-xs font-medium"
              >
                <Download className="w-3 h-3" />
                <span className="hidden sm:inline">Download</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analysis" 
                className="flex items-center justify-center space-x-1 data-[state=active]:bg-red-600 data-[state=active]:text-white px-2 py-2 rounded-xl text-xs font-medium"
              >
                <Brain className="w-3 h-3" />
                <span className="hidden sm:inline">AI Analysis</span>
              </TabsTrigger>
              <TabsTrigger 
                value="gallery" 
                className="flex items-center justify-center space-x-1 data-[state=active]:bg-red-600 data-[state=active]:text-white px-2 py-2 rounded-xl text-xs font-medium"
              >
                <Video className="w-3 h-3" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="download">
              <DownloadCenter />
            </TabsContent>
            
            <TabsContent value="analysis">
              <AIAnalysis url="" videoTitle="" />
            </TabsContent>
            
            <TabsContent value="gallery">
              <Gallery />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Why Choose Our Downloader?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Built with cutting-edge technology for the best downloading experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <div className="text-white text-sm">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


    </div>
  );
};

export default Index;
