import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Video, Music, Settings } from 'lucide-react';

interface QualityDropdownProps {
  onDownload: (format: 'video' | 'audio', quality: string) => void;
  disabled?: boolean;
  className?: string;
}

const QualityDropdown: React.FC<QualityDropdownProps> = ({
  onDownload,
  disabled = false,
  className = '',
}) => {
  const [selectedQuality, setSelectedQuality] = useState('1080p');
  const [selectedFormat, setSelectedFormat] = useState<'video' | 'audio'>('video');

  const videoQualities = [
    { value: '4K', label: '4K (2160p)', description: 'Ultra HD', size: '~2-4 GB' },
    { value: '1440p', label: '1440p', description: '2K QHD', size: '~1-2 GB' },
    { value: '1080p', label: '1080p', description: 'Full HD', size: '~500 MB-1 GB' },
    { value: '720p', label: '720p', description: 'HD', size: '~200-500 MB' },
    { value: '480p', label: '480p', description: 'SD', size: '~100-200 MB' },
    { value: '360p', label: '360p', description: 'Low', size: '~50-100 MB' },
    { value: '144p', label: '144p', description: 'Lowest', size: '~10-30 MB' },
  ];

  const audioQualities = [
    { value: '320', label: '320 kbps', description: 'Highest Quality', size: '~5-10 MB/min' },
    { value: '256', label: '256 kbps', description: 'High Quality', size: '~4-8 MB/min' },
    { value: '192', label: '192 kbps', description: 'Medium Quality', size: '~3-6 MB/min' },
    { value: '128', label: '128 kbps', description: 'Standard Quality', size: '~2-4 MB/min' },
  ];

  const handleQualitySelect = (format: 'video' | 'audio', quality: string, label: string) => {
    setSelectedQuality(label);
    setSelectedFormat(format);
    onDownload(format, quality);
  };

  return (
    <div className="space-y-2">
      {/* Quick Download Button */}
      <Button
        onClick={() => onDownload('video', '1080p')}
        disabled={disabled}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
      >
        <Video className="w-4 h-4 mr-2" />
        Quick Download (1080p)
      </Button>

      {/* Professional Quality Selector - Hidden by Default */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="w-full border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 dark:border-slate-600 dark:hover:border-blue-500 dark:hover:bg-blue-950"
          >
            <Settings className="w-4 h-4 mr-2" />
            Select Quality
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="center">
          <DropdownMenuLabel className="flex items-center text-blue-600 dark:text-blue-400">
            <Video className="w-4 h-4 mr-2" />
            Video Quality Selection
          </DropdownMenuLabel>
          {videoQualities.map((quality) => (
            <DropdownMenuItem
              key={quality.value}
              onClick={() => handleQualitySelect('video', quality.value, quality.label)}
              className="flex justify-between items-center cursor-pointer py-3 hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              <div className="flex flex-col">
                <span className="font-medium text-slate-900 dark:text-white">{quality.label}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{quality.description}</span>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">{quality.size}</span>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="flex items-center text-green-600 dark:text-green-400">
            <Music className="w-4 h-4 mr-2" />
            Audio Only (MP3)
          </DropdownMenuLabel>
          {audioQualities.map((quality) => (
            <DropdownMenuItem
              key={quality.value}
              onClick={() => handleQualitySelect('audio', quality.value, quality.label)}
              className="flex justify-between items-center cursor-pointer py-3 hover:bg-green-50 dark:hover:bg-green-950"
            >
              <div className="flex flex-col">
                <span className="font-medium text-slate-900 dark:text-white">{quality.label}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{quality.description}</span>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">{quality.size}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default QualityDropdown;
