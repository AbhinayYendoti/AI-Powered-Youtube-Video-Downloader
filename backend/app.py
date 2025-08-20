import os
import google.generativeai as genai
import json
import subprocess
import threading
import time
import re
import unicodedata
import shutil
import tempfile
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv

# Ensure the downloads directory exists
DOWNLOAD_DIR = 'downloads'
TEMP_DIR = 'temp_downloads'  # Temporary directory for downloads
if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)
if not os.path.exists(TEMP_DIR):
    os.makedirs(TEMP_DIR)

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini API key
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# Create a model instance (Gemini-pro or gemini-1.5-flash)
model = genai.GenerativeModel("gemini-1.5-flash")

def parse_size_to_bytes(size_str):
    """Convert size string like '123.4MiB' to bytes"""
    try:
        size_str = size_str.strip()
        if 'GiB' in size_str:
            return int(float(size_str.replace('GiB', '')) * 1024 * 1024 * 1024)
        elif 'MiB' in size_str:
            return int(float(size_str.replace('MiB', '')) * 1024 * 1024)
        elif 'KiB' in size_str:
            return int(float(size_str.replace('KiB', '')) * 1024)
        elif 'B' in size_str:
            return int(float(size_str.replace('B', '')))
        else:
            return int(float(size_str))
    except (ValueError, AttributeError):
        return 0

def sanitize_filename(filename):
    """Sanitize filename to be safe for HTTP headers and file system"""
    # Remove or replace problematic characters
    # Remove emojis and special Unicode characters
    filename = unicodedata.normalize('NFKD', filename)
    filename = ''.join(c for c in filename if unicodedata.category(c) != 'Mn')
    
    # Replace problematic characters with safe alternatives
    filename = re.sub(r'[^\w\s\-_.]', '_', filename)
    filename = re.sub(r'[^\x00-\x7F]+', '_', filename)  # Remove non-ASCII characters
    
    # Remove multiple underscores and spaces
    filename = re.sub(r'_{2,}', '_', filename)
    filename = re.sub(r'\s+', ' ', filename)
    
    # Limit length
    if len(filename) > 100:
        filename = filename[:100]
    
    # Remove leading/trailing spaces and underscores
    filename = filename.strip(' _')
    
    return filename if filename else "video"

@app.route("/api/video/info", methods=["GET"])
def get_video_info():
    try:
        url = request.args.get("url")
        if not url:
            return jsonify({"error": "No URL provided"}), 400

        # Normalize Shorts URLs to avoid extractor quirks
        if "/shorts/" in url:
            # Extract video ID from Shorts URL and convert to watch URL
            video_id_match = re.search(r'/shorts/([a-zA-Z0-9_-]+)', url)
            if video_id_match:
                video_id = video_id_match.group(1)
                url = f"https://www.youtube.com/watch?v={video_id}"
                print(f"AI Analysis - Normalized Shorts URL to: {url}")

        # First, get video title using yt-dlp
        try:
            title_cmd = ["yt-dlp", "--get-title", "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", url]
            title_result = subprocess.run(title_cmd, capture_output=True, text=True, timeout=15)
            
            if title_result.returncode != 0:
                # Try without user agent as fallback
                title_cmd = ["yt-dlp", "--get-title", url]
                title_result = subprocess.run(title_cmd, capture_output=True, text=True, timeout=15)
            
            video_title = title_result.stdout.strip() if title_result.returncode == 0 else "Unknown Title"
        except:
            video_title = "Unknown Title"

        # Initialize variables
        duration = 0
        uploader = 'Unknown'
        view_count = 0
        upload_date = 'Unknown'
        description = ''
        
        # Get video metadata using yt-dlp
        try:
            metadata_cmd = ["yt-dlp", "--dump-json", "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", url]
            metadata_result = subprocess.run(metadata_cmd, capture_output=True, text=True, timeout=45)
            
            if metadata_result.returncode != 0:
                # Try without user agent as fallback
                metadata_cmd = ["yt-dlp", "--dump-json", url]
                metadata_result = subprocess.run(metadata_cmd, capture_output=True, text=True, timeout=30)
            
            if metadata_result.returncode == 0:
                video_data = json.loads(metadata_result.stdout)
                description = video_data.get('description', '')[:1000]  # Limit description length
                duration = video_data.get('duration', 0)
                uploader = video_data.get('uploader', 'Unknown')
                view_count = video_data.get('view_count', 0)
                upload_date = video_data.get('upload_date', 'Unknown')
                
                # Create a more detailed prompt with actual video information
                prompt = f"""Based on the available metadata for this YouTube video, provide an analysis in JSON format. 

CRITICAL LIMITATION: You are analyzing based on title and description ONLY. You cannot see, hear, or process the actual video content. You must acknowledge this limitation in your response.

Video Information:
Title: {video_title}
Uploader: {uploader}
Duration: {duration} seconds ({duration//60} minutes {duration%60} seconds)
View Count: {view_count:,} views
Upload Date: {upload_date}
Description: {description[:800]}...

MANDATORY INSTRUCTIONS:
- Start your summary with "Based on the video metadata (title and description) only:"
- Acknowledge that you cannot see the actual video content
- Base your analysis ONLY on the provided title and description
- If the description is too short or vague, explicitly state this limitation
- Do not invent specific details not mentioned in the metadata
- Focus on what can be reasonably inferred from the available information
- If you cannot provide meaningful analysis due to limited information, state this clearly

Please provide analysis in this exact JSON format:
{{
  "summary": "Based on the video metadata (title and description) only: [Your analysis here. If information is insufficient, acknowledge this limitation.]",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "topics": ["topic 1", "topic 2", "topic 3"]
}}

Only return the JSON object, no other text."""
            else:
                # Fallback to basic prompt if metadata extraction fails
                prompt = f"""Based on the video title only, provide a limited analysis in JSON format.

CRITICAL LIMITATION: You only have access to the title: "{video_title}"
You cannot see, hear, or process the actual video content. You must acknowledge this limitation.

MANDATORY INSTRUCTIONS:
- Start your summary with "Based on the video title only:"
- Explicitly state that you cannot see the actual video content
- Do not make assumptions about content you cannot see
- If the title is unclear or insufficient, acknowledge this limitation
- Focus only on what can be reasonably inferred from the title

Please provide analysis in this exact JSON format:
{{
  "summary": "Based on the video title only: [Your analysis here. If the title is insufficient, acknowledge this limitation.]",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "topics": ["topic 1", "topic 2", "topic 3"]
}}

Only return the JSON object, no other text."""
        except:
            # Fallback to basic prompt if metadata extraction fails
            prompt = f"""Based on the video title only, provide a limited analysis in JSON format.

CRITICAL LIMITATION: You only have access to the title: "{video_title}"
You cannot see, hear, or process the actual video content. You must acknowledge this limitation.

MANDATORY INSTRUCTIONS:
- Start your summary with "Based on the video title only:"
- Explicitly state that you cannot see the actual video content
- Do not make assumptions about content you cannot see
- If the title is unclear or insufficient, acknowledge this limitation
- Focus only on what can be reasonably inferred from the title

Please provide analysis in this exact JSON format:
{{
  "summary": "Based on the video title only: [Your analysis here. If the title is insufficient, acknowledge this limitation.]",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "topics": ["topic 1", "topic 2", "topic 3"]
}}

Only return the JSON object, no other text."""
        
        response = model.generate_content(prompt)

        try:
            # Extract JSON string from markdown code block if present
            response_text = response.text.strip()
            if response_text.startswith('```json') and response_text.endswith('```'):
                json_string = response_text[len('```json'):-len('```')].strip()
            else:
                json_string = response_text

            ai_response = json.loads(json_string)
            summary = ai_response.get("summary", "")
            key_points = ai_response.get("keyPoints", [])
            topics = ai_response.get("topics", [])
        except json.JSONDecodeError:
             # Fallback if AI doesn't return valid JSON
             summary = f"Unable to parse AI response. Raw response: {response.text[:200]}..."
             key_points = ["Analysis failed - unable to parse AI response"]
             topics = ["Error in analysis"]

        return jsonify({
            "title": video_title,
            "aiSummary": summary,
            "keyPoints": key_points,
            "topics": topics,
            "duration": duration,
            "status": "completed"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/video/formats", methods=["GET"])
def get_video_formats():
    try:
        url = request.args.get("url")
        if not url:
            return jsonify({"error": "No URL provided"}), 400

        # Normalize Shorts URLs to avoid extractor quirks
        if "/shorts/" in url:
            # Extract video ID from Shorts URL and convert to watch URL
            video_id_match = re.search(r'/shorts/([a-zA-Z0-9_-]+)', url)
            if video_id_match:
                video_id = video_id_match.group(1)
                url = f"https://www.youtube.com/watch?v={video_id}"
                print(f"Formats - Normalized Shorts URL to: {url}")

        # Get available formats using yt-dlp
        cmd = ["yt-dlp", "--list-formats", "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", url]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode != 0:
            # Try without user agent as fallback
            cmd = ["yt-dlp", "--list-formats", url]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                return jsonify({"error": "Failed to get video formats"}), 500

        # Parse the output to extract available qualities
        lines = result.stdout.strip().split('\n')
        formats = []
        
        for line in lines:
            # Skip header lines and non-format lines
            if not line.strip() or 'ID' in line or '─' in line or 'Available formats' in line:
                continue
                
            parts = line.split()
            if len(parts) >= 3:
                format_id = parts[0]
                ext = parts[1]
                resolution = parts[2]
                
                # Check if this is a video format with resolution (exclude storyboards)
                if resolution and resolution != 'audio' and 'x' in resolution and ext != 'mhtml':
                    # Extract height from resolution (e.g., "640x360" -> "360p")
                    try:
                        height = resolution.split('x')[1]
                        if height.isdigit():
                            height_int = int(height)
                            if height_int >= 2160:
                                resolution_str = "4k"
                            elif height_int >= 1440:
                                resolution_str = "1440p"
                            elif height_int >= 1080:
                                resolution_str = "1080p"
                            elif height_int >= 720:
                                resolution_str = "720p"
                            elif height_int >= 480:
                                resolution_str = "480p"
                            elif height_int >= 360:
                                resolution_str = "360p"
                            else:
                                resolution_str = "240p"
                            
                            formats.append({
                                "id": format_id,
                                "resolution": resolution_str,
                                "format": ext
                            })
                    except:
                        continue

        return jsonify({
            "formats": formats,
            "available_qualities": list(set([f["resolution"] for f in formats if f["resolution"] != "unknown"]))
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        data = request.get_json()
        url = data.get("url")

        if not url:
            return jsonify({"error": "No URL provided"}), 400

        # Generate analysis
        prompt = f"""Based on the YouTube URL provided, provide a limited analysis in JSON format.

CRITICAL LIMITATION: You are analyzing based on URL only. You cannot see, hear, or process the actual video content. You must acknowledge this limitation.

MANDATORY INSTRUCTIONS:
- Start your summary with "Based on the YouTube URL only:"
- Explicitly state that you cannot see the actual video content
- Do not make assumptions about content you cannot see
- If you cannot access the video information, acknowledge this limitation
- Focus only on what can be reasonably inferred from the URL

YouTube URL: {url}

Please provide analysis in this exact JSON format:
{{
  "summary": "Based on the YouTube URL only: [Your analysis here. If information is insufficient, acknowledge this limitation.]",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "topics": ["topic 1", "topic 2", "topic 3"]
}}

Only return the JSON object, no other text."""
        response = model.generate_content(prompt)

        try:
            # Extract JSON string from markdown code block if present
            response_text = response.text.strip()
            if response_text.startswith('```json') and response_text.endswith('```'):
                json_string = response_text[len('```json'):-len('```')].strip()
            else:
                json_string = response_text

            ai_response = json.loads(json_string)
            summary = ai_response.get("summary", "")
            key_points = ai_response.get("keyPoints", [])
            topics = ai_response.get("topics", [])
        except json.JSONDecodeError:
             # Fallback if AI doesn't return valid JSON
             summary = f"Unable to parse AI response. Raw response: {response.text[:200]}..."
             key_points = ["Analysis failed - unable to parse AI response"]
             topics = ["Error in analysis"]

        return jsonify({"summary": summary, "keyPoints": key_points,
            "topics": topics, "status": "completed"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Dictionary to store download progress with thread lock for safety
download_progress = {}
download_progress_lock = threading.Lock()

@app.route("/api/download", methods=["POST"])
def download_video():
    data = request.get_json()
    url = data.get("url")
    format_type = data.get("format", "video") # 'video' or 'audio'
    quality = data.get("quality", "best")

    print(f"Download request - URL: {url}")
    print(f"Download request - Format: {format_type}")
    print(f"Download request - Quality: {quality}")

    if not url:
        return jsonify({"error": "URL is required"}), 400

    download_id = str(time.time())
    
    # Create unique job directory for this download
    job_dir = tempfile.mkdtemp(prefix=f"job_{download_id}_", dir=TEMP_DIR)
    
    with download_progress_lock:
        download_progress[download_id] = {
            "state": "started",
            "progress": 0,
            "filePath": None,
            "tempFilePath": None,
            "jobDir": job_dir,
            "error_message": None,
            "speed": None,
            "eta": None
        }

    # Run download in a separate thread to avoid blocking the main Flask thread
    threading.Thread(target=execute_download, args=(url, format_type, quality, download_id)).start()
    
    # Start a fallback progress simulation in case yt-dlp progress parsing fails
    def simulate_progress():
        import time
        progress = 0
        while progress < 90 and download_id in download_progress:
            with download_progress_lock:
                if download_id not in download_progress or download_progress[download_id]["state"] != "downloading":
                    break
                if download_progress[download_id]["progress"] == 0:
                    progress += 5  # Increment by 5% every 2 seconds
                    download_progress[download_id]["progress"] = progress
                    print(f"Fallback progress simulation: {progress}%")
            time.sleep(2)  # Update every 2 seconds
    
    threading.Thread(target=simulate_progress).start()

    return jsonify({"status": "started", "download_id": download_id})

@app.route("/api/download/status", methods=["GET"])
def get_download_status():
    download_id = request.args.get("id")
    with download_progress_lock:
        if download_id and download_id in download_progress:
            return jsonify(download_progress[download_id])
    return jsonify({"error": "Download ID not found"}), 404

@app.route("/api/download", methods=["GET"])
def serve_downloaded_file():
    filename = request.args.get("filename")
    download_id = request.args.get("download_id")
    
    if download_id:
        with download_progress_lock:
            if download_id in download_progress:
                # Serve from stored tempFilePath for this specific job
                temp_file_path = download_progress[download_id].get("tempFilePath")
                if temp_file_path and os.path.exists(temp_file_path):
                    # Use sanitized filename for download
                    sanitized_filename = download_progress[download_id].get("sanitizedFilename", os.path.basename(temp_file_path))
                    
                    # Force browser download popup
                    response = send_file(
                        temp_file_path, 
                        as_attachment=True,
                        download_name=sanitized_filename
                    )
                    # Set headers to force download
                    response.headers['Content-Disposition'] = f'attachment; filename="{sanitized_filename}"'
                    response.headers['Content-Type'] = 'application/octet-stream'
                    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
                    response.headers['Pragma'] = 'no-cache'
                    response.headers['Expires'] = '0'
                    response.headers['Access-Control-Allow-Origin'] = '*'
                    response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
                    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
                    return response
    elif filename:
        # Legacy support for gallery downloads
        file_path = os.path.join(DOWNLOAD_DIR, filename)
        if os.path.exists(file_path):
            # Sanitize filename for gallery downloads too
            sanitized_filename = sanitize_filename(os.path.splitext(filename)[0]) + os.path.splitext(filename)[1]
            response = send_file(
                file_path, 
                as_attachment=True,
                download_name=sanitized_filename
            )
            response.headers['Content-Disposition'] = f'attachment; filename="{sanitized_filename}"'
            response.headers['Content-Type'] = 'application/octet-stream'
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
            return response
    
    return jsonify({"error": "File not found"}), 404

@app.route("/api/download/cleanup", methods=["POST"])
def cleanup_downloaded_file():
    """Move temporary file to downloads directory and clean up job directory"""
    try:
        data = request.get_json()
        download_id = data.get("download_id")
        filename = data.get("filename")
        
        if download_id:
            with download_progress_lock:
                if download_id in download_progress:
                    # Move temporary file to downloads directory
                    temp_file_path = download_progress[download_id].get("tempFilePath")
                    job_dir = download_progress[download_id].get("jobDir")
                    
                    if temp_file_path and os.path.exists(temp_file_path):
                        # Get the sanitized filename
                        sanitized_filename = download_progress[download_id].get("sanitizedFilename", os.path.basename(temp_file_path))
                        
                        # Move file to downloads directory
                        download_file_path = os.path.join(DOWNLOAD_DIR, sanitized_filename)
                        
                        # Ensure downloads directory exists
                        if not os.path.exists(DOWNLOAD_DIR):
                            os.makedirs(DOWNLOAD_DIR)
                        
                        # Move the file
                        shutil.move(temp_file_path, download_file_path)
                        
                        # Clean up job directory
                        if job_dir and os.path.exists(job_dir):
                            try:
                                shutil.rmtree(job_dir)
                                print(f"Cleaned up job directory: {job_dir}")
                            except Exception as e:
                                print(f"Error cleaning up job directory: {e}")
                        
                        # Remove from progress tracking
                        del download_progress[download_id]
                        return jsonify({"message": "File moved to downloads successfully"})
        elif filename:
            # Legacy cleanup for gallery files
            file_path = os.path.join(DOWNLOAD_DIR, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
                return jsonify({"message": "File cleaned up successfully"})
        
        return jsonify({"error": "File not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/gallery", methods=["GET"])
def get_gallery():
    try:
        files = []
        if os.path.exists(DOWNLOAD_DIR):
            for filename in os.listdir(DOWNLOAD_DIR):
                file_path = os.path.join(DOWNLOAD_DIR, filename)
                if os.path.isfile(file_path) and filename.endswith(('.mp4', '.mp3', '.webm', '.m4a')):
                    file_stat = os.stat(file_path)
                    files.append({
                        "name": filename,
                        "size": file_stat.st_size,
                        "modified": file_stat.st_mtime,
                        "downloadUrl": f"/api/download?filename={filename}",
                        "deleteUrl": f"/api/gallery/delete?filename={filename}"
                    })
        
        # Sort by modification time (newest first)
        files.sort(key=lambda x: x["modified"], reverse=True)
        return jsonify({"files": files})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/gallery/delete", methods=["DELETE"])
def delete_file():
    try:
        filename = request.args.get("filename")
        if filename:
            file_path = os.path.join(DOWNLOAD_DIR, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
                return jsonify({"message": "File deleted successfully"})
        return jsonify({"error": "File not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def execute_download(url, format_type, quality, download_id):
    try:
        # Get job directory for this download
        with download_progress_lock:
            if download_id not in download_progress:
                print(f"Download ID {download_id} not found in progress tracking")
                return
            job_dir = download_progress[download_id]["jobDir"]
            download_progress[download_id]["state"] = "downloading"

        # Normalize Shorts URLs to avoid extractor quirks
        if "/shorts/" in url:
            # Extract video ID from Shorts URL and convert to watch URL
            video_id_match = re.search(r'/shorts/([a-zA-Z0-9_-]+)', url)
            if video_id_match:
                video_id = video_id_match.group(1)
                url = f"https://www.youtube.com/watch?v={video_id}"
                print(f"Normalized Shorts URL to: {url}")

        # yt-dlp command construction - save to JOB-SPECIFIC folder
        output_template = os.path.join(job_dir, "%(title)s.%(ext)s")
        cmd = ["yt-dlp", url, "-o", output_template, "--newline", "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"]

        if format_type == "audio":
            # For audio extraction (MP3)
            cmd.extend(["-x", "--audio-format", "mp3"])
            
            # Add audio quality settings
            if quality == "320":
                cmd.extend(["--audio-quality", "0"])  # Best quality
            elif quality == "256":
                cmd.extend(["--audio-quality", "5"])  # High quality
            elif quality == "128":
                cmd.extend(["--audio-quality", "9"])  # Standard quality
            else:
                cmd.extend(["--audio-quality", "0"])  # Default to best
        else:
            # For video formats
            if quality == "best" or not quality:
                # Best available quality
                cmd.append("-f")
                cmd.append("bestvideo+bestaudio/best")
            elif quality == "4k":
                cmd.append("-f")
                cmd.append("bestvideo[height<=2160]+bestaudio/best[height<=2160]/best")
            elif quality == "1080p":
                cmd.append("-f")
                cmd.append("bestvideo[height<=1080]+bestaudio/best[height<=1080]/best")
            elif quality == "720p":
                cmd.append("-f")
                cmd.append("bestvideo[height<=720]+bestaudio/best[height<=720]/best")
            elif quality == "480p":
                cmd.append("-f")
                cmd.append("bestvideo[height<=480]+bestaudio/best[height<=480]/best")
            elif quality == "360p":
                cmd.append("-f")
                cmd.append("bestvideo[height<=360]+bestaudio/best[height<=360]/best")
            else:
                # Default to best quality if unknown quality specified
                cmd.append("-f")
                cmd.append("bestvideo+bestaudio/best")

        # Add progress hook and other options
        cmd.extend([
            "--progress"
        ])
        
        # Add merge output format for video
        if format_type == "video":
            cmd.extend(["--merge-output-format", "mp4"])

        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)

        final_file_path = None
        
        for line in process.stdout:
            # Debug: Print all lines to see what yt-dlp outputs
            print(f"yt-dlp output: {line.strip()}")
            
            # Track final file path from yt-dlp output
            if "[Merger] Merging formats into" in line:
                # Extract final video file path
                file_path_match = re.search(r'\[Merger\] Merging formats into "([^"]+)"', line)
                if file_path_match:
                    final_file_path = file_path_match.group(1)
                    print(f"Final video file: {final_file_path}")
            elif "[ExtractAudio] Destination:" in line:
                # Extract final audio file path
                file_path_match = re.search(r'\[ExtractAudio\] Destination: (.+)', line)
                if file_path_match:
                    final_file_path = file_path_match.group(1).strip()
                    print(f"Final audio file: {final_file_path}")
            
            # Simple percentage extraction - look for any percentage in the line
            if "%" in line:
                try:
                    # Find percentage in the line
                    percent_match = re.search(r'(\d+\.?\d*)%', line)
                    if percent_match:
                        progress = float(percent_match.group(1))
                        print(f"Found progress: {progress}%")
                        
                        with download_progress_lock:
                            if download_id in download_progress:
                                download_progress[download_id]["progress"] = progress
                                download_progress[download_id]["state"] = "downloading"
                                
                                # Try to extract speed
                                speed_match = re.search(r'(\d+\.?\d*[KM]iB/s)', line)
                                if speed_match:
                                    download_progress[download_id]["speed"] = speed_match.group(1)
                                    print(f"Found speed: {speed_match.group(1)}")
                                
                                # Try to extract ETA
                                eta_match = re.search(r'ETA (\d+:\d+)', line)
                                if eta_match:
                                    download_progress[download_id]["eta"] = eta_match.group(1)
                                    print(f"Found ETA: {eta_match.group(1)}")
                except Exception as e:
                    print(f"Error parsing progress: {e}")
            
            # Parse download progress with more detailed information
            if "[download]" in line:
                print(f"Found download line: {line.strip()}")
                if "%" in line:
                    try:
                        # Extract percentage from lines like: [download] 45.2% of 123.4MiB at 2.3MiB/s ETA 00:30
                        parts = line.split()
                        for i, part in enumerate(parts):
                            if "%" in part:
                                percent_str = part.replace("%", "")
                                progress = float(percent_str)
                                print(f"Parsed progress: {progress}%")
                                
                                with download_progress_lock:
                                    if download_id in download_progress:
                                        download_progress[download_id]["progress"] = progress
                                        download_progress[download_id]["state"] = "downloading"
                                        
                                        # Also extract speed and ETA if available
                                        if i + 1 < len(parts) and ("MiB/s" in parts[i + 1] or "KiB/s" in parts[i + 1]):
                                            download_progress[download_id]["speed"] = parts[i + 1]
                                            print(f"Parsed speed: {parts[i + 1]}")
                                        if "ETA" in line:
                                            eta_start = line.find("ETA")
                                            if eta_start != -1:
                                                eta_part = line[eta_start:].split()[1]
                                                download_progress[download_id]["eta"] = eta_part
                                                print(f"Parsed ETA: {eta_part}")
                                break
                    except ValueError as e:
                        print(f"Error parsing percentage: {e}")
                        pass
                elif "of" in line and "at" in line:
                    # Parse lines like: [download] 45.2MiB of 123.4MiB at 2.3MiB/s ETA 00:30
                    try:
                        parts = line.split()
                        for i, part in enumerate(parts):
                            if part == "of" and i > 0 and i + 1 < len(parts):
                                downloaded = parts[i - 1]
                                total = parts[i + 1]
                                
                                print(f"Downloaded: {downloaded}, Total: {total}")
                                
                                # Convert to bytes for percentage calculation
                                downloaded_bytes = parse_size_to_bytes(downloaded)
                                total_bytes = parse_size_to_bytes(total)
                                
                                print(f"Downloaded bytes: {downloaded_bytes}, Total bytes: {total_bytes}")
                                
                                if total_bytes > 0:
                                    progress = (downloaded_bytes / total_bytes) * 100
                                    progress = min(progress, 99.9)  # Cap at 99.9% until complete
                                    print(f"Calculated progress: {progress}%")
                                    
                                    with download_progress_lock:
                                        if download_id in download_progress:
                                            download_progress[download_id]["progress"] = progress
                                            download_progress[download_id]["state"] = "downloading"
                                            
                                            # Extract speed
                                            for j, speed_part in enumerate(parts):
                                                if "MiB/s" in speed_part or "KiB/s" in speed_part:
                                                    download_progress[download_id]["speed"] = speed_part
                                                    print(f"Parsed speed: {speed_part}")
                                                    break
                                            
                                            # Extract ETA
                                            if "ETA" in line:
                                                eta_start = line.find("ETA")
                                                if eta_start != -1:
                                                    eta_part = line[eta_start:].split()[1]
                                                    download_progress[download_id]["eta"] = eta_part
                                                    print(f"Parsed ETA: {eta_part}")
                                break
                    except (ValueError, IndexError) as e:
                        print(f"Error parsing size-based progress: {e}")
                        pass
            elif "[ExtractAudio] Destination:" in line or "[Merger] Merging into" in line:
                print("Found processing line")
                with download_progress_lock:
                    if download_id in download_progress:
                        download_progress[download_id]["state"] = "processing"
                        download_progress[download_id]["progress"] = 95  # Set to 95% during processing

        process.wait()

        if process.returncode == 0:
            # Use the captured final file path or find file in job directory
            try:
                if final_file_path and os.path.exists(final_file_path):
                    # Use the file path captured from yt-dlp output
                    file_path = final_file_path
                    print(f"Using captured file path: {file_path}")
                else:
                    # Fallback: look for files in job-specific directory only
                    downloaded_files = []
                    for f in os.listdir(job_dir):
                        if f.endswith(('.mp4', '.mp3', '.webm', '.m4a')):
                            file_path = os.path.join(job_dir, f)
                            if os.path.isfile(file_path):
                                downloaded_files.append((f, os.path.getmtime(file_path)))
                    
                    if downloaded_files:
                        # Get the most recently modified file from job directory
                        latest_file = max(downloaded_files, key=lambda x: x[1])[0]
                        file_path = os.path.join(job_dir, latest_file)
                        print(f"Found file in job directory: {file_path}")
                    else:
                        print("No downloaded files found in job directory")
                        raise Exception("No downloaded files found")
                
                # Create a sanitized filename for download
                original_name = os.path.basename(file_path)
                file_ext = os.path.splitext(original_name)[1]
                base_name = os.path.splitext(original_name)[0]
                sanitized_name = sanitize_filename(base_name) + file_ext
                
                with download_progress_lock:
                    if download_id in download_progress:
                        download_progress[download_id]["filePath"] = original_name
                        download_progress[download_id]["sanitizedFilename"] = sanitized_name
                        download_progress[download_id]["tempFilePath"] = file_path
                        download_progress[download_id]["state"] = "done"
                        download_progress[download_id]["progress"] = 100
                        print(f"Download completed: {original_name}")
                        print(f"Sanitized filename: {sanitized_name}")
                        print(f"File path: {file_path}")
                
            except Exception as e:
                print(f"Error finding downloaded file: {e}")
                with download_progress_lock:
                    if download_id in download_progress:
                        download_progress[download_id]["state"] = "error"
                        download_progress[download_id]["error_message"] = f"Failed to locate downloaded file: {str(e)}"
        else:
            with download_progress_lock:
                if download_id in download_progress:
                    download_progress[download_id]["state"] = "error"
                    download_progress[download_id]["error_message"] = f"yt-dlp failed with exit code {process.returncode}"

    except Exception as e:
        print(f"Download error: {e}")
        with download_progress_lock:
            if download_id in download_progress:
                download_progress[download_id]["state"] = "error"
                download_progress[download_id]["error_message"] = str(e)

if __name__ == "__main__":
    app.run(debug=True, port=8095)