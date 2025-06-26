
import React from 'react';

const Navigation = () => {
  return (
    <nav className="flex items-center justify-between p-6">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
          <span className="text-white font-bold text-sm">YT</span>
        </div>
        <span className="text-white text-xl font-semibold">YT Downloader</span>
      </div>
      
      <div className="hidden md:flex space-x-8">
        <a href="#" className="text-purple-100 hover:text-white transition-colors">Home</a>
        <a href="#" className="text-purple-100 hover:text-white transition-colors">About</a>
        <a href="#" className="text-purple-100 hover:text-white transition-colors">FAQ</a>
      </div>
    </nav>
  );
};

export default Navigation;
