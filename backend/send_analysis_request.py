import requests
import json
import sys

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python send_analysis_request.py <youtube_url>")
        sys.exit(1)

    youtube_url = sys.argv[1]
    
    url = "http://127.0.0.1:5000/analyze"
    payload = {"url": youtube_url}
    headers = {'Content-Type': 'application/json'}

    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")