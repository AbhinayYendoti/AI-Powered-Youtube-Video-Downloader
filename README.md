<<<<<<< HEAD
# YouTube Video Downloader

A full-stack web application that allows users to download YouTube videos by providing the video URL. The application features a Spring Boot REST API backend and a modern React frontend interface.

## Features

- 🎥 **High Quality Downloads**: Support for multiple video qualities (1080p, 720p, 480p, 360p)
- 🎵 **Audio Extraction**: Convert videos to MP3 audio files
- ⚡ **Fast & Free**: No registration required, completely free to use
- 🔄 **Real-time Progress**: Live download progress tracking
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🛡️ **Secure**: Input validation and security measures

## Tech Stack

### Backend
- **Spring Boot 3.2.0** - Java 17+
- **H2 Database** - In-memory database for development
- **yt-dlp** - Python library for video downloading
- **Maven** - Build tool

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Axios** - HTTP client
- **React Query** - Data fetching

## Prerequisites

Before running this application, make sure you have the following installed:

- **Java 17 or higher**
- **Node.js 16+ and npm**
- **Python 3.7+** (for yt-dlp)
- **yt-dlp** installed globally

### Installing yt-dlp

```bash
# Using pip
pip install yt-dlp

# Or using pipx (recommended)
pipx install yt-dlp

# Verify installation
yt-dlp --version
```

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd clip-caster-web
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Build the project
mvn clean install

# Run the Spring Boot application
mvn spring-boot:run
```

The backend will start on `http://localhost:8095`

### 3. Frontend Setup

```bash
# Navigate back to root directory
cd ..

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:5173`

## Usage

1. **Open the Application**: Navigate to `http://localhost:5173` in your browser
2. **Paste YouTube URL**: Enter a valid YouTube video URL
3. **Select Format**: Choose between video (MP4) or audio (MP3)
4. **Choose Quality**: Select your preferred quality/bitrate
5. **Start Download**: Click the download button and wait for processing
6. **Download File**: The file will automatically download when ready

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/videos/info` | Get video information |
| POST | `/api/download` | Start video download |
| GET | `/api/download/status` | Get download progress |
| GET | `/api/download` | Download completed file |
| DELETE | `/api/download/{filename}` | Delete downloaded file |
| GET | `/api/health` | Health check |

## Project Structure

```
clip-caster-web/
├── backend/                          # Spring Boot backend
│   ├── src/main/java/com/example/downloader/
│   │   ├── controller/               # REST controllers
│   │   ├── service/                  # Business logic
│   │   ├── model/                    # Data models
│   │   ├── dto/                      # Data transfer objects
│   │   ├── config/                   # Configuration
│   │   └── exception/                # Custom exceptions
│   ├── src/main/resources/
│   │   ├── application.yml           # Application config
│   │   └── static/downloads/         # Download directory
│   └── pom.xml                       # Maven dependencies
├── src/                              # React frontend
│   ├── components/                   # React components
│   ├── pages/                        # Page components
│   ├── hooks/                        # Custom hooks
│   └── lib/                          # Utilities
├── package.json                      # Frontend dependencies
└── README.md                         # This file
```

## Configuration

### Backend Configuration

The backend configuration is in `backend/src/main/resources/application.yml`:

```yaml
server:
  port: 8095

app:
  download:
    directory: downloads/
    max-file-size: 500MB
    yt-dlp:
      command: yt-dlp
      timeout: 300000
```

### Frontend Configuration

The frontend connects to the backend API at `http://localhost:8095`. You can modify the API base URL in the components if needed.

## Development

### Backend Development

```bash
cd backend

# Run with hot reload
mvn spring-boot:run

# Run tests
mvn test

# Build JAR
mvn clean package
```

### Frontend Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## Troubleshooting

### Common Issues

1. **yt-dlp not found**
   - Ensure yt-dlp is installed: `pip install yt-dlp`
   - Verify it's in your PATH: `yt-dlp --version`

2. **CORS Issues**
   - The backend is configured to allow requests from `localhost:5173`
   - Check that the frontend is running on the correct port

3. **Download Failures**
   - Check that the YouTube URL is valid and accessible
   - Ensure you have sufficient disk space
   - Check the backend logs for detailed error messages

4. **Port Already in Use**
   - Change the backend port in `application.yml`
   - Update the frontend API calls accordingly

### Logs

- **Backend logs**: Check the console output when running `mvn spring-boot:run`
- **Frontend logs**: Check the browser developer console

## Security Considerations

- Input validation for YouTube URLs
- File size limits to prevent abuse
- Directory traversal protection
- CORS configuration for production
- File cleanup after downloads

## Legal Compliance

**Important**: This application is for educational purposes. Please ensure compliance with:

- YouTube's Terms of Service
- Copyright laws
- Content creators' rights

Only download content you own or have permission to download.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is for educational purposes. Please respect all applicable laws and terms of service.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs for error messages
3. Ensure all prerequisites are installed
4. Verify the configuration is correct
=======
# Youtube-Video-Downloader
>>>>>>> 171e2f1edfca20676143ff844dd8ec2dcc16ad98
