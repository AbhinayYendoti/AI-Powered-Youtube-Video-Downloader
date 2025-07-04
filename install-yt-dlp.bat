@echo off
echo Installing yt-dlp for YouTube Video Downloader...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.7+ from https://python.org
    pause
    exit /b 1
)

echo Python is installed. Installing yt-dlp...
echo.

REM Install yt-dlp using pip
pip install yt-dlp

if errorlevel 1 (
    echo ERROR: Failed to install yt-dlp
    echo Please try running: pip install yt-dlp manually
    pause
    exit /b 1
)

echo.
echo yt-dlp installed successfully!
echo.

REM Verify installation
yt-dlp --version

if errorlevel 1 (
    echo WARNING: yt-dlp may not be in PATH
    echo Please restart your terminal/command prompt
) else (
    echo yt-dlp is ready to use!
)

echo.
echo You can now run the YouTube Video Downloader application.
echo.
pause 