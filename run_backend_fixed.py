#!/usr/bin/env python
import os
import sys
import subprocess
import time

def main():
    print("Starting AushadhiAI backend server on port 8007...")
    
    # Check if we're in the correct directory structure
    if os.path.exists("backend/app.py"):
        backend_dir = "backend"
    else:
        print("Error: Cannot locate backend/app.py")
        print(f"Current directory: {os.getcwd()}")
        sys.exit(1)
    
    # Change to the backend directory
    os.chdir(backend_dir)
    print(f"Changed directory to: {os.getcwd()}")
    
    try:
        # Start the server
        print("Starting uvicorn server...")
        subprocess.run([
            sys.executable, 
            "-c", 
            "import uvicorn; uvicorn.run('app:app', host='127.0.0.1', port=8007)"
        ])
    except KeyboardInterrupt:
        print("Server shutdown requested.")
    except Exception as e:
        print(f"Error starting server: {e}")
    
    print("Server process ended.")

if __name__ == "__main__":
    main() 