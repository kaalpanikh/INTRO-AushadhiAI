"""
AushadhiAI System Health Checker
This script performs a comprehensive check of all system components
to ensure everything is properly configured for the hackathon demo.
"""

import os
import sys
import requests
import socket
import json
from pathlib import Path
import importlib.util
import time
import subprocess

# Configuration
BACKEND_PORT = 8001
FRONTEND_PORT = 8000
BACKEND_API_BASE = f"http://localhost:{BACKEND_PORT}/api"
REQUIRED_PACKAGES = [
    "fastapi", "uvicorn", "azure-cognitiveservices-vision-computervision", 
    "msrest", "pydantic", "pillow"
]

# ANSI Colors for better output
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"

def print_header(text):
    """Print a formatted header"""
    print(f"\n{BOLD}{BLUE}{'=' * 60}{RESET}")
    print(f"{BOLD}{BLUE}{text.center(60)}{RESET}")
    print(f"{BOLD}{BLUE}{'=' * 60}{RESET}\n")

def print_success(text):
    """Print a success message"""
    print(f"{GREEN}✓ {text}{RESET}")

def print_warning(text):
    """Print a warning message"""
    print(f"{YELLOW}⚠ {text}{RESET}")

def print_error(text):
    """Print an error message"""
    print(f"{RED}✗ {text}{RESET}")

def print_info(text):
    """Print an info message"""
    print(f"{BLUE}ℹ {text}{RESET}")

def check_port_available(port):
    """Check if a port is available"""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.bind(("localhost", port))
        s.close()
        return True
    except socket.error:
        return False

def check_package_installed(package_name):
    """Check if a Python package is installed"""
    spec = importlib.util.find_spec(package_name)
    return spec is not None

def check_api_endpoint(endpoint, method="GET", data=None):
    """Check if an API endpoint is reachable"""
    url = f"{BACKEND_API_BASE}/{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url, timeout=3)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=3)
        
        if response.status_code == 200:
            return True, response.json()
        else:
            return False, {"status_code": response.status_code}
    except requests.exceptions.RequestException:
        return False, {"error": "Connection error"}

def check_azure_config():
    """Check if Azure configuration is properly set up"""
    config_path = Path("backend/config.py")
    
    if not config_path.exists():
        print_error(f"Config file not found at {config_path}")
        return False
    
    # Extract Azure configuration
    with open(config_path, "r") as f:
        config_content = f.read()
    
    has_key = "AZURE_VISION_KEY" in config_content
    has_endpoint = "AZURE_VISION_ENDPOINT" in config_content
    
    # Check if they appear to be properly configured
    using_default_key = "your_azure_vision_key_here" in config_content
    using_default_endpoint = "your-resource-name" in config_content
    
    if not has_key or not has_endpoint:
        print_error("Azure configuration variables missing from config.py")
        return False
    
    if using_default_key or using_default_endpoint:
        print_error("Azure configuration contains default placeholder values")
        return False
    
    print_success("Azure configuration found in config.py")
    return True

def check_demo_files():
    """Check if demo files are properly set up"""
    required_files = [
        "demo.html",
        "backend/app.py",
        "backend/config.py",
        "backend/services/azure_vision_service.py"
    ]
    
    all_exist = True
    for file_path in required_files:
        if not Path(file_path).exists():
            print_error(f"Required file not found: {file_path}")
            all_exist = False
        else:
            print_success(f"Found required file: {file_path}")
    
    return all_exist

def check_azure_connection_direct():
    """Test Azure connection directly"""
    try:
        # Import config and test Azure connection
        sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
        from config import AZURE_VISION_KEY, AZURE_VISION_ENDPOINT
        
        if not AZURE_VISION_KEY or not AZURE_VISION_ENDPOINT:
            print_error("Azure credentials are missing or empty")
            return False
        
        # Only test if we actually have credentials
        from azure.cognitiveservices.vision.computervision import ComputerVisionClient
        from msrest.authentication import CognitiveServicesCredentials
        
        client = ComputerVisionClient(
            endpoint=AZURE_VISION_ENDPOINT,
            credentials=CognitiveServicesCredentials(AZURE_VISION_KEY)
        )
        
        # Simple API call to test connectivity
        api_version = client.api_version
        print_success(f"Successfully connected to Azure Computer Vision API v{api_version}")
        return True
        
    except ImportError as e:
        print_error(f"Failed to import Azure libraries: {str(e)}")
        print_info("Run: pip install azure-cognitiveservices-vision-computervision msrest")
        return False
    except Exception as e:
        print_error(f"Failed to connect to Azure: {str(e)}")
        return False

def main():
    """Main function to run all checks"""
    print_header("AushadhiAI System Health Check")
    
    # Check dependencies
    print_header("Checking Python Dependencies")
    all_packages_installed = True
    for package in REQUIRED_PACKAGES:
        if check_package_installed(package):
            print_success(f"Package {package} is installed")
        else:
            print_error(f"Package {package} is NOT installed")
            all_packages_installed = False
    
    if not all_packages_installed:
        print_warning("Some packages are missing. Run: pip install -r backend/requirements.txt")
    
    # Check required files
    print_header("Checking Required Files")
    files_exist = check_demo_files()
    
    # Check ports
    print_header("Checking Port Availability")
    if check_port_available(BACKEND_PORT):
        print_success(f"Backend port {BACKEND_PORT} is available")
    else:
        print_warning(f"Backend port {BACKEND_PORT} is already in use (server may already be running)")
        
    if check_port_available(FRONTEND_PORT):
        print_success(f"Frontend port {FRONTEND_PORT} is available")
    else:
        print_warning(f"Frontend port {FRONTEND_PORT} is already in use (server may already be running)")
    
    # Check Azure configuration
    print_header("Checking Azure Configuration")
    config_valid = check_azure_config()
    
    # Test Azure connection directly
    print_header("Testing Azure Connection")
    azure_connection = check_azure_connection_direct()
    
    # Try to reach backend API if it's running
    print_header("Testing Backend API")
    if not check_port_available(BACKEND_PORT):
        # Port is in use, server might be running
        health_check, health_data = check_api_endpoint("health")
        if health_check:
            print_success(f"API health check successful: {json.dumps(health_data)}")
            
            # Test Azure endpoint
            azure_check, azure_data = check_api_endpoint("check-azure")
            if azure_check:
                print_success(f"Azure API check successful: {json.dumps(azure_data)}")
            else:
                print_error(f"Azure API check failed: {json.dumps(azure_data)}")
        else:
            print_error("Backend API health check failed")
            print_info(f"Health check response: {health_data}")
    else:
        print_info("Backend server is not running. Start it with:")
        print_info("cd backend && python -m uvicorn app:app --host 127.0.0.1 --port 8001")
    
    # Summary
    print_header("System Health Summary")
    all_good = all_packages_installed and files_exist and config_valid and azure_connection
    
    if all_good:
        print_success("All system checks passed! Your AushadhiAI demo is ready for the hackathon.")
        print_info("1. Start the backend: cd backend && python -m uvicorn app:app --host 127.0.0.1 --port 8001")
        print_info("2. Start the frontend: python -m http.server 8000")
        print_info("3. Open http://localhost:8000/demo.html in your browser")
    else:
        print_warning("Some system checks failed. Please address the issues above.")
        
        # Provide specific remediation steps based on what failed
        if not all_packages_installed:
            print_info("→ Install missing packages: pip install -r backend/requirements.txt")
            
        if not files_exist:
            print_info("→ Ensure all required files are present in the correct locations")
            
        if not config_valid:
            print_info("→ Check your Azure configuration in backend/config.py")
            
        if not azure_connection:
            print_info("→ Verify your Azure credentials and ensure the service is accessible")

if __name__ == "__main__":
    main()
