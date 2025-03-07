@echo off
echo ===================================
echo AushadhiAI Setup and Startup Script
echo ===================================
echo.

REM Check if Python is installed
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH.
    echo Please install Python 3.8 or newer from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

echo Python is installed. Checking required packages...
echo.

REM Create and activate a virtual environment
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing required packages...
echo This may take a few minutes...
pip install -r backend\requirements.txt

echo.
echo ===================================
echo Setup complete!
echo.
echo To start the AushadhiAI server:
echo 1. Open a command prompt in this directory
echo 2. Run: start_server.bat
echo.
echo Once the server is running, open index.html in your browser.
echo ===================================
pause
