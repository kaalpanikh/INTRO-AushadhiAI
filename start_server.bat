@echo off
echo ===================================
echo Starting AushadhiAI Server
echo ===================================
echo.

REM Activate virtual environment
call venv\Scripts\activate.bat

echo Starting FastAPI server...
echo.
echo When you see "Application startup complete" message, the server is ready.
echo.
echo Access the application by opening index.html in your browser.
echo Press Ctrl+C to stop the server when done.
echo.

cd backend
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload

pause
