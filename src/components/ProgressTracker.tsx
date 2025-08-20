import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Download, Pause, Play, X, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface ProgressTrackerProps {
  downloadId: string | null;
  isDownloading: boolean;
  onCancel: () => void;
  onPause: () => void;
  onResume: () => void;
}

interface DownloadProgress {
  state: string;
  progress: number;
  filePath?: string;
  error?: string;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  downloadId,
  isDownloading,
  onCancel,
  onPause,
  onResume
}) => {
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [eta, setEta] = useState<string>('');

  useEffect(() => {
    if (downloadId && isDownloading) {
      setStartTime(Date.now());
      pollProgress();
    } else {
      setProgress(null);
      setStartTime(null);
      setEta('');
    }
  }, [downloadId, isDownloading]);

  const pollProgress = async () => {
    if (!downloadId || !isDownloading) return;

    try {
              const response = await axios.get(`http://localhost:8095/api/download/status?id=${downloadId}`);
      const data = response.data;
      
      setProgress(data);
      
      // Calculate ETA
      if (data.progress > 0 && startTime) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = data.progress / elapsed;
        const remaining = (100 - data.progress) / rate;
        setEta(formatTime(remaining));
      }

      // Continue polling if not completed or error
      if (data.state === 'downloading' || data.state === 'processing') {
        setTimeout(pollProgress, 1000);
      }
    } catch (error) {
      console.error('Error polling progress:', error);
      // Retry after 2 seconds
      setTimeout(pollProgress, 2000);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  };

  const getStatusIcon = () => {
    if (!progress) return <Clock className="w-5 h-5 text-gray-500" />;
    
    switch (progress.state) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'downloading':
      case 'processing':
        return <Download className="w-5 h-5 text-blue-600 animate-bounce" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    if (!progress) return 'Preparing...';
    
    switch (progress.state) {
      case 'completed':
        return 'Download Complete';
      case 'error':
        return 'Download Failed';
      case 'downloading':
        return 'Downloading...';
      case 'processing':
        return 'Processing...';
      default:
        return 'Preparing...';
    }
  };

  const getStatusColor = () => {
    if (!progress) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    
    switch (progress.state) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'downloading':
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (!isDownloading && !progress) {
    return null;
  }

  return (
    <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-slate-900 dark:text-white">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>
          <Badge variant="secondary" className={getStatusColor()}>
            {progress?.progress || 0}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>Progress</span>
            <span>{progress?.progress || 0}%</span>
          </div>
          <Progress value={progress?.progress || 0} className="w-full" />
        </div>

        {/* Status Information */}
        {progress && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="text-slate-600 dark:text-slate-400">Status:</span>
                <span className="font-medium text-slate-900 dark:text-white capitalize">
                  {progress.state}
                </span>
              </div>
            </div>
            
            {eta && (
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-600 dark:text-slate-400">ETA:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {eta}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {progress?.error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
                <p className="text-sm text-red-700 dark:text-red-300">{progress.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {(progress?.state === 'downloading' || progress?.state === 'processing') && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsPaused(!isPaused);
                  isPaused ? onResume() : onPause();
                }}
                className="flex-1"
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={onCancel}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
          
          {progress?.state === 'completed' && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Done
            </Button>
          )}
          
          {progress?.state === 'error' && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;
