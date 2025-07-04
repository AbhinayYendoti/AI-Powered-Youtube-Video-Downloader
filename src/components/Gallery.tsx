import React, { useState, useEffect } from 'react';
import { Download, Trash2, FileVideo, FileAudio, RefreshCw, Copy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';

interface FileInfo {
  name: string;
  size: number;
  lastModified: number;
  downloadUrl: string;
  deleteUrl: string;
}

const Gallery = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8095/api/gallery');
      setFiles(response.data.files || []);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error",
        description: "Failed to load gallery files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshGallery = async () => {
    setRefreshing(true);
    await loadFiles();
    setRefreshing(false);
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleDownload = async (file: FileInfo) => {
    try {
      // Create a direct link to the download URL
      const downloadUrl = `http://localhost:8095${file.downloadUrl}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.name;
      link.target = '_blank'; // Open in new tab/window
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: "Download Started",
        description: `${file.name} is being downloaded`,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the file",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (file: FileInfo) => {
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:8095${file.deleteUrl}`);
      toast({
        title: "File Deleted",
        description: `${file.name} has been deleted`,
      });
      loadFiles(); // Refresh the gallery
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the file",
        variant: "destructive",
      });
    }
  };

  const handleCopyUrl = async (file: FileInfo) => {
    try {
      const downloadUrl = `http://localhost:8095${file.downloadUrl}`;
      await navigator.clipboard.writeText(downloadUrl);
      toast({
        title: "URL Copied",
        description: "Download URL copied to clipboard",
      });
    } catch (error) {
      console.error('Error copying URL:', error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy URL to clipboard",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop();
    if (ext === 'mp4' || ext === 'avi' || ext === 'mov' || ext === 'mkv') {
      return <FileVideo className="w-8 h-8 text-red-500" />;
    } else if (ext === 'mp3' || ext === 'wav' || ext === 'flac') {
      return <FileAudio className="w-8 h-8 text-blue-500" />;
    }
    return <FileVideo className="w-8 h-8 text-gray-500" />;
  };

  if (loading) {
    return (
      <Card className="max-w-6xl mx-auto bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
        <CardHeader className="text-center">
                  <CardTitle className="text-white text-2xl">History</CardTitle>
        <p className="text-purple-100">Loading your download history...</p>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-6xl mx-auto bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2 text-white text-2xl">
          <span>History</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshGallery}
            disabled={refreshing}
            className="ml-2 text-white hover:bg-white/20"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <p className="text-purple-100">
          {files.length === 0 
            ? "No downloads yet. Start downloading videos to see your history here!" 
            : `You have ${files.length} downloaded file${files.length === 1 ? '' : 's'} in your history`
          }
        </p>
      </CardHeader>
      
      <CardContent>
        {files.length === 0 ? (
          <div className="text-center py-8">
            <FileVideo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300">No files in history</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {files.map((file, index) => (
              <Card key={index} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    {getFileIcon(file.name)}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate" title={file.name}>
                        {file.name}
                      </h3>
                      <p className="text-purple-200 text-sm">
                        {formatFileSize(file.size)}
                      </p>
                      <p className="text-purple-200 text-xs">
                        {formatDate(file.lastModified)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => handleDownload(file)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyUrl(file)}
                      className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(file)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Gallery; 