@echo off
echo Starting YouTube Video Downloader...
echo.

REM Check if yt-dlp is installed
yt-dlp --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: yt-dlp is not installed or not in PATH
    echo Please run install-yt-dlp.bat first
    pause
    exit /b 1
)

echo yt-dlp is available. Starting application...
echo.

REM Start backend in a new window
echo Starting Spring Boot backend...
start "YouTube Downloader Backend" cmd /k "cd backend && mvn spring-boot:run"

REM Wait a moment for backend to start
timeout /t 5 /nobreak >nul

REM Start frontend in a new window
echo Starting React frontend...
start "YouTube Downloader Frontend" cmd /k "npm run dev"

echo.
echo Application is starting...
echo Backend will be available at: http://localhost:8095
echo Frontend will be available at: http://localhost:5173
echo.
echo Press any key to open the frontend in your browser...
pause >nul

REM Open frontend in default browser
start http://localhost:5173

echo.
echo Application started successfully!
echo You can close this window now.
pause 