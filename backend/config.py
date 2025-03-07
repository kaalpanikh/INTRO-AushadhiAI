# Azure Cognitive Services configuration
# To use real Azure OCR:
# 1. Log into Azure Portal: https://portal.azure.com
# 2. Navigate to your Computer Vision resource
# 3. Go to "Keys and Endpoint" in the sidebar
# 4. Copy Key 1 and Endpoint URL
# 5. Replace the placeholder values below

# Set USE_AZURE_OCR to True to use real Azure OCR
USE_AZURE_OCR = True

# Your Azure credentials are correctly configured
AZURE_VISION_KEY = "1BUzJ4Dr444av4ikJ3X3qfb9bpFeKodrjCNrBtUEALstuNIqecUJJQQJ99BCACYeBjFXJ3w3AAAFACOGxnpP"
AZURE_VISION_ENDPOINT = "https://aushadhiai-computervision.cognitiveservices.azure.com/"

# RxNorm API configuration
RXNORM_API_BASE_URL = "https://rxnav.nlm.nih.gov/REST"

# Application configuration
DEBUG = True
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload size
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

import os
from typing import List
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

# API Settings
PORT = int(os.getenv("PORT", 8007))
HOST = os.getenv("HOST", "0.0.0.0")

# Azure Vision API
AZURE_VISION_ENDPOINT = os.getenv("AZURE_VISION_ENDPOINT", "")
AZURE_VISION_KEY = os.getenv("AZURE_VISION_KEY", "")

# CORS Settings
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:8006").split(",")

# Use Azure OCR setting 
USE_AZURE_OCR = os.getenv("USE_AZURE_OCR", "True").lower() == "true"

# RxNorm API configuration
RXNORM_API_BASE_URL = "https://rxnav.nlm.nih.gov/REST"

# Application Settings
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
ENV = os.getenv("ENV", "development")
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload size
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def validate_config() -> List[str]:
    """Validate that all required config variables are set"""
    errors = []
    
    if not AZURE_VISION_ENDPOINT:
        errors.append("AZURE_VISION_ENDPOINT must be set")
    
    if not AZURE_VISION_KEY:
        errors.append("AZURE_VISION_KEY must be set")
    
    return errors
