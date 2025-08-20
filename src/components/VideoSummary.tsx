import React from 'react';

interface VideoSummaryProps {
  title: string;
  aiSummary: string | null;
  isLoading: boolean;
}

const VideoSummary: React.FC<VideoSummaryProps> = ({ title, aiSummary, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white/10 rounded-lg p-4 mt-4 text-center text-purple-200">
        Loading video information...
      </div>
    );
  }
  return (
    <div className="bg-white/10 rounded-lg p-4 mt-4">
      <h3 className="text-white text-lg font-medium mb-2">Video Information</h3>
      <p className="text-purple-200 text-sm mb-2"><strong>Title:</strong> {title}</p>
      {aiSummary && (
        <p className="text-purple-200 text-sm"><strong>AI Summary:</strong> {aiSummary}</p>
      )}
    </div>
  );
};

export default VideoSummary;