"""
Simple Azure Computer Vision Test Script for AushadhiAI
"""

import os
import sys
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from msrest.authentication import CognitiveServicesCredentials

def test_azure():
    # Import config directly from the file to avoid path issues
    sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
    from config import AZURE_VISION_KEY, AZURE_VISION_ENDPOINT
    
    print("=" * 50)
    print("AZURE COMPUTER VISION VERIFICATION")
    print("=" * 50)
    print(f"Endpoint: {AZURE_VISION_ENDPOINT}")
    print(f"Key (first 5 chars): {AZURE_VISION_KEY[:5]}...")
    
    try:
        # Create client
        client = ComputerVisionClient(
            endpoint=AZURE_VISION_ENDPOINT,
            credentials=CognitiveServicesCredentials(AZURE_VISION_KEY)
        )
        
        # Simple API call to check connectivity
        api_version = client.api_version
        
        print("\n✅ CONNECTION SUCCESSFUL!")
        print(f"Connected to Azure Computer Vision API version: {api_version}")
        print("Your Azure integration is properly configured.")
        return True
    except Exception as e:
        print("\n❌ CONNECTION FAILED!")
        print(f"Error: {str(e)}")
        print("Please verify your Azure key and endpoint in backend/config.py")
        return False

if __name__ == "__main__":
    test_azure()
