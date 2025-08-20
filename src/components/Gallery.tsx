import React, { useState, useEffect } from 'react';
import { Video, Music, FileText, Download, Trash2, Eye, Calendar, HardDrive } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';

interface FileInfo {
  name: string;
  size: number;
  lastModified: number;
  downloadUrl: string;
  deleteUrl: string;
  type: 'video' | 'audio' | 'other';
}

const Gallery: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();

  // Add auto-refresh functionality
  useEffect(() => {
    fetchFiles();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchFiles(false); // Don't show loading state for auto-refresh
    }, 30000);
    
    // Listen for download completion events
    const handleDownloadComplete = () => {
      fetchFiles(false); // Don't show loading state for event-triggered refresh
    };
    
    window.addEventListener('download-complete', handleDownloadComplete);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('download-complete', handleDownloadComplete);
    };
  }, []);

  const fetchFiles = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const response = await axios.get('http://localhost:8095/api/gallery');
      const fileList = response.data.files.map((file: any) => ({
        ...file,
        type: getFileType(file.name)
      }));
      setFiles(fileList);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      });
    } finally {
      if (showLoading) {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  const getFileType = (filename: string): 'video' | 'audio' | 'other' => {
    const ext = filename.toLowerCase().split('.').pop();
    if (['mp4', 'webm', 'mkv', 'avi', 'mov'].includes(ext || '')) return 'video';
    if (['mp3', 'm4a', 'wav', 'flac', 'ogg', 'aac'].includes(ext || '')) return 'audio';
    return 'other';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateFileName = (filename: string, maxLength: number = 40): string => {
    if (filename.length <= maxLength) return filename;
    
    // Try to find a good break point (space, dash, underscore)
    const breakPoints = [' ', '-', '_', '.'];
    let bestBreak = maxLength;
    
    for (const breakPoint of breakPoints) {
      const lastBreak = filename.lastIndexOf(breakPoint, maxLength);
      if (lastBreak > maxLength * 0.7) { // Only use if it's not too early
        bestBreak = lastBreak;
        break;
      }
    }
    
    return filename.substring(0, bestBreak) + '...';
  };

  const handleDownload = async (file: FileInfo) => {
    try {
      const downloadUrl = `http://localhost:8095${file.downloadUrl}`;
      console.log('Gallery Download URL:', downloadUrl);
      
      // Method 1: Try using window.open to force download popup
      try {
        window.open(downloadUrl, '_blank');
      } catch (openError) {
        console.log('Window.open failed, trying direct link...');
        
        // Method 2: Create and click a link
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = file.name;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      toast({
        title: "Download Started",
        description: `${file.name} is being downloaded to your system`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the file",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (file: FileInfo) => {
    try {
              await axios.delete(`http://localhost:8095${file.deleteUrl}`);
      setFiles(files.filter(f => f.name !== file.name));
      
      toast({
        title: "File Deleted",
        description: `${file.name} has been deleted`,
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete the file",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5 text-blue-600" />;
      case 'audio':
        return <Music className="w-5 h-5 text-green-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'video':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Video</Badge>;
      case 'audio':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Audio</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">File</Badge>;
    }
  };

  const filteredAndSortedFiles = files
    .filter(file => 
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'date':
          comparison = a.lastModified - b.lastModified;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const videoCount = files.filter(f => f.type === 'video').length;
  const audioCount = files.filter(f => f.type === 'audio').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Download History</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Manage your downloaded files</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isRefreshing && (
                <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span className="text-sm">Refreshing...</span>
                </div>
              )}
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {files.length} files
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Videos</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{videoCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Audio</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{audioCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Size</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatFileSize(totalSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Latest</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {files.length > 0 ? formatDate(Math.max(...files.map(f => f.lastModified))) : 'None'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'size' | 'date')}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="date">Date</option>
                <option value="name">Name</option>
                <option value="size">Size</option>
              </select>
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
              <Button
                variant="outline"
                onClick={fetchFiles}
                disabled={isLoading}
              >
                <Eye className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files Grid */}
      {isLoading ? (
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading files...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredAndSortedFiles.length === 0 ? (
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                {searchTerm ? 'No files match your search' : 'No files found'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedFiles.map((file, index) => (
            <Card key={index} className="border-0 shadow-lg bg-white dark:bg-slate-800 hover:shadow-xl transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-2 flex-1 min-w-0">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white text-sm leading-tight mb-1" title={file.name}>
                        {truncateFileName(file.name, 35)}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    {getTypeBadge(file.type)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 mb-4">
                  <span>{formatDate(file.lastModified)}</span>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleDownload(file)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(file)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery; 