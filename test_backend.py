import requests
import time
import sys

def test_backend_connection():
    """Test if the backend server is responding."""
    url = "http://localhost:8007/api/health"
    max_attempts = 10
    
    print(f"Testing connection to backend server at {url}")
    print("Waiting for the server to start...")
    
    for attempt in range(max_attempts):
        try:
            response = requests.get(url, timeout=2)
            if response.status_code == 200:
                print(f"✅ SUCCESS: Backend server is responding! Status code: {response.status_code}")
                return True
            else:
                print(f"❌ Server responded with status code: {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"Attempt {attempt + 1}/{max_attempts}: Server not ready yet. Retrying in 2 seconds...")
            time.sleep(2)
    
    print("❌ ERROR: Backend server failed to respond after multiple attempts.")
    return False

if __name__ == "__main__":
    success = test_backend_connection()
    sys.exit(0 if success else 1) 