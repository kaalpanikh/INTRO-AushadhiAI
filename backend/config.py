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
