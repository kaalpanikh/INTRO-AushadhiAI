@echo off
echo =====================================
echo Starting AushadhiAI Application
echo =====================================

REM Check if Python is installed
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed or not in the PATH.
    echo Please install Python 3.6+ and try again.
    pause
    exit /b 1
)

echo Starting backend server on port 8007...
start cmd /k "python run_backend_fixed.py"

REM Wait a moment for the backend to start
timeout /t 5 /nobreak

echo Testing backend connection...
python test_backend.py
if %ERRORLEVEL% NEQ 0 (
    echo Backend server failed to start. Please check error messages.
    pause
    exit /b 1
)

echo Starting frontend server on port 8006...
start cmd /k "python -m http.server 8006 --bind 127.0.0.1"

REM Wait a moment for the frontend to start
timeout /t 2 /nobreak

echo Opening application in browser...
start http://127.0.0.1:8006/demo.html

echo =====================================
echo AushadhiAI is now running!
echo Backend: http://127.0.0.1:8007
echo Frontend: http://127.0.0.1:8006
echo =====================================
echo To stop the application, close both command windows. 