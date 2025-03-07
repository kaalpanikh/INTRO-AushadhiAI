import sys
import os
import subprocess

print("Starting AushadhiAI backend server on port 9000...")

# Change to the backend directory
os.chdir("backend")

# Start the server using subprocess
subprocess.run(["python", "-c", "import uvicorn; uvicorn.run('app:app', host='0.0.0.0', port=9000)"]) 