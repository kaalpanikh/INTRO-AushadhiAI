@echo off
echo Starting AushadhiAI backend server on port 9000...
cd backend
python -c "import uvicorn; uvicorn.run('app:app', host='0.0.0.0', port=9000)" 