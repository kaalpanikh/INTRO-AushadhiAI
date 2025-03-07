"""
AushadhiAI Hackathon Demo Launcher
This script will start all necessary services for your demo presentation.
"""

import os
import sys
import subprocess
import time
import webbrowser
import socket

def is_port_in_use(port):
    """Check if a port is already in use"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def main():
    # Define colors for better output
    GREEN = "\033[92m"
    BLUE = "\033[94m"
    YELLOW = "\033[93m"
    RESET = "\033[0m"
    
    print(f"{BLUE}{'=' * 60}{RESET}")
    print(f"{BLUE}{'AushadhiAI Hackathon Demo Launcher':^60}{RESET}")
    print(f"{BLUE}{'=' * 60}{RESET}")
    
    # Check if ports are available
    backend_port = 8001
    frontend_port = 8000
    
    if is_port_in_use(backend_port):
        print(f"{YELLOW}Warning: Port {backend_port} is already in use.{RESET}")
        print(f"{YELLOW}The backend server may already be running.{RESET}")
    
    if is_port_in_use(frontend_port):
        print(f"{YELLOW}Warning: Port {frontend_port} is already in use.{RESET}")
        print(f"{YELLOW}The frontend server may already be running.{RESET}")
    
    # Start the backend server
    print(f"\n{GREEN}Starting backend server...{RESET}")
    backend_cmd = [sys.executable, "-m", "uvicorn", "app:app", "--host", "127.0.0.1", "--port", str(backend_port)]
    
    try:
        backend_process = subprocess.Popen(
            backend_cmd,
            cwd=os.path.join(os.getcwd(), "backend"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            creationflags=subprocess.CREATE_NEW_CONSOLE  # Open in new window
        )
        
        print(f"{GREEN}Backend server started in a new window!{RESET}")
        print(f"{GREEN}API running at: http://localhost:{backend_port}/api{RESET}")
        
        # Short delay to allow backend to start
        time.sleep(2)
        
    except Exception as e:
        print(f"Error starting backend server: {e}")
        return
    
    # Start the frontend server
    print(f"\n{GREEN}Starting frontend server...{RESET}")
    frontend_cmd = [sys.executable, "-m", "http.server", str(frontend_port)]
    
    try:
        frontend_process = subprocess.Popen(
            frontend_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            creationflags=subprocess.CREATE_NEW_CONSOLE  # Open in new window
        )
        
        print(f"{GREEN}Frontend server started in a new window!{RESET}")
        print(f"{GREEN}Demo available at: http://localhost:{frontend_port}/demo.html{RESET}")
        
        # Open the demo page in the default browser
        time.sleep(2)
        demo_url = f"http://localhost:{frontend_port}/demo.html"
        print(f"\n{GREEN}Opening demo interface in your browser...{RESET}")
        webbrowser.open(demo_url)
        
    except Exception as e:
        print(f"Error starting frontend server: {e}")
        return
    
    print(f"\n{GREEN}AushadhiAI demo is now running!{RESET}")
    print(f"- Demo interface: http://localhost:{frontend_port}/demo.html")
    print(f"- Backend API: http://localhost:{backend_port}/api")
    print(f"\n{YELLOW}Use Ctrl+C in the server terminal windows to stop the servers when done.{RESET}")
    
if __name__ == "__main__":
    main()
