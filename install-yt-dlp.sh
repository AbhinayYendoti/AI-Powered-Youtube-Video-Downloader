#!/bin/bash

echo "Installing yt-dlp for YouTube Video Downloader..."
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed or not in PATH"
    echo "Please install Python 3.7+ from https://python.org"
    exit 1
fi

echo "Python is installed. Installing yt-dlp..."
echo

# Install yt-dlp using pip
if command -v pip3 &> /dev/null; then
    pip3 install yt-dlp
elif command -v pip &> /dev/null; then
    pip install yt-dlp
else
    echo "ERROR: pip is not installed"
    echo "Please install pip first"
    exit 1
fi

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install yt-dlp"
    echo "Please try running: pip install yt-dlp manually"
    exit 1
fi

echo
echo "yt-dlp installed successfully!"
echo

# Verify installation
if command -v yt-dlp &> /dev/null; then
    echo "yt-dlp version:"
    yt-dlp --version
    echo
    echo "yt-dlp is ready to use!"
else
    echo "WARNING: yt-dlp may not be in PATH"
    echo "Please restart your terminal or add pip's bin directory to PATH"
fi

echo
echo "You can now run the YouTube Video Downloader application."
echo 