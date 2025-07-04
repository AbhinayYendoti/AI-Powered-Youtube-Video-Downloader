
import React, { useState } from 'react';
import { Download, Image } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navigation from '@/components/Navigation';
import FeatureCard from '@/components/FeatureCard';
import DownloadCenter from '@/components/DownloadCenter';
import Gallery from '@/components/Gallery';

const Index = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'downloader' | 'history'>('downloader');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <Navigation />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Download YouTube Videos
          </h1>
          <p className="text-xl text-purple-100 max-w-3xl mx-auto leading-relaxed">
            Fast, free, and easy-to-use YouTube video downloader. Support for multiple 
            formats and high-quality downloads.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-1 border border-white/20">
            <Button
              variant={activeTab === 'downloader' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('downloader')}
              className={`mr-1 ${activeTab === 'downloader' 
                ? 'bg-white text-purple-900' 
                : 'text-white hover:bg-white/20'}`}
            >
              <Download className="w-4 h-4 mr-2" />
              Downloader
            </Button>
            <Button
              variant={activeTab === 'history' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('history')}
              className={`${activeTab === 'history' 
                ? 'bg-white text-purple-900' 
                : 'text-white hover:bg-white/20'}`}
            >
              <Image className="w-4 h-4 mr-2" />
              History
            </Button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'downloader' ? (
        <DownloadCenter />
        ) : (
          <Gallery />
        )}

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <FeatureCard
            icon="🎥"
            title="High Quality"
            description="Download videos up to 1080p HD and audio up to 320kbps"
          />
          <FeatureCard
            icon="⚡"
            title="Fast & Free"
            description="No registration required. Download instantly and completely free"
          />
          <FeatureCard
            icon="🎵"
            title="Multiple Formats"
            description="Support for MP4 video and MP3 audio formats"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-purple-200">
        <p className="mb-2">© 2024 YT Downloader. Free YouTube video downloader tool.</p>
        <p className="text-sm text-purple-300">
          Disclaimer: Please respect copyright laws and YouTube's terms of service.
        </p>
      </footer>
    </div>
  );
};

export default Index;
