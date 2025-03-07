import uvicorn
from app import app

if __name__ == "__main__":
    print("Starting AushadhiAI server on port 9000...")
    uvicorn.run(app, host="0.0.0.0", port=9000) 