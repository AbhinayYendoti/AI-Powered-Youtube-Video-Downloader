import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const DownloaderForm: React.FC = () => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'video' | 'audio'>('video');
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [downloadLink, setDownloadLink] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<'idle' | 'downloading' | 'processing' | 'done' | 'error'>('idle');
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (downloadId && (state === 'downloading' || state === 'processing')) {
      pollRef.current = setInterval(async () => {
        try {
          const res = await axios.get(`http://localhost:8095/api/download/status?id=${downloadId}`);
          if (res.data) {
            if (typeof res.data.progress === 'number') setProgress(res.data.progress);
            if (res.data.state) setState(res.data.state);
            if (res.data.state === 'done') {
              setStatus('Download completed!');
              setDownloadLink(null); // Optionally, fetch the file path if available
              clearInterval(pollRef.current!);
            } else if (res.data.state === 'error') {
              setStatus('An error occurred during download.');
              clearInterval(pollRef.current!);
            }
          }
        } catch (err) {
          setStatus('Failed to get status.');
          setState('error');
          clearInterval(pollRef.current!);
        }
      }, 1000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [downloadId, state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    setLoading(true);
    setDownloadLink(null);
    setProgress(0);
    setState('downloading');
    setDownloadId(null);
    try {
      const res = await axios.post('http://localhost:8095/api/download', { url, format });
      console.log('Backend response:', res.data); // Debug log
      
      if (res.data.status === 'started' && res.data.download_id) {
        setDownloadId(res.data.download_id);
        setStatus('Download started successfully!');
        setLoading(false);
      } else if (res.data.status === 'error') {
        setStatus(res.data.message || 'Download failed');
        setState('error');
        setLoading(false);
      } else {
        // Handle case where backend returns success but no download_id
        console.log('Unexpected response format:', res.data);
        setStatus('Download started (checking status...)');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Download error:', err); // Debug log
      setStatus(err.response?.data?.message || 'Server error');
      setState('error');
      setLoading(false);
    }
  };

  // UI for progress bar and processing state
  const renderProgress = () => {
    if (state === 'downloading') {
      return (
        <div className="mt-6">
          <div className="flex justify-between mb-1">
            <span className="text-white text-lg font-semibold">Downloading...</span>
            <span className="text-white text-lg font-semibold">{progress}%</span>
          </div>
          <div className="w-full bg-purple-300 rounded-full h-4">
            <div
              className="bg-black h-4 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      );
    }
    if (state === 'processing') {
      return (
        <div className="mt-6 flex items-center justify-center">
          <div className="w-full bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg h-16 flex items-center justify-center opacity-80">
            <svg className="animate-spin h-8 w-8 mr-4 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-2xl text-white font-bold">Processing...</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-gradient-to-br from-purple-700 to-purple-900 rounded-xl shadow-lg mt-10">
      <h2 className="text-2xl font-bold mb-4 text-white">YouTube Video Downloader</h2>
      <div className="mb-4">
        <label className="block mb-1 font-medium text-white">Paste YouTube URL:</label>
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="https://youtube.com/..."
          required
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium text-white">Select Format:</label>
        <div className="flex gap-4">
          <label className="text-white">
            <input
              type="radio"
              name="format"
              value="video"
              checked={format === 'video'}
              onChange={() => setFormat('video')}
            />{' '}
            Video
          </label>
          <label className="text-white">
            <input
              type="radio"
              name="format"
              value="audio"
              checked={format === 'audio'}
              onChange={() => setFormat('audio')}
            />{' '}
            Audio
          </label>
        </div>
      </div>
      <button
        type="submit"
        className="w-full bg-pink-600 text-white py-2 rounded hover:bg-pink-700 disabled:opacity-50 font-bold text-lg"
        disabled={loading || state === 'downloading' || state === 'processing'}
      >
        {state === 'downloading' ? 'Downloading...' : state === 'processing' ? 'Processing...' : 'Download'}
      </button>
      {renderProgress()}
      <div className="mt-4 min-h-[24px] text-center">
        {status && <span className="text-white text-lg">{status}</span>}
        {state === 'done' && (
          <div className="mt-2">
            <span className="text-green-300 font-semibold">Download complete! Check your downloads folder.</span>
          </div>
        )}
        {state === 'error' && (
          <div className="mt-2">
            <span className="text-red-300 font-semibold">{status}</span>
          </div>
        )}
      </div>
    </form>
  );
};

export default DownloaderForm;