"""
Azure Vision API Diagnostic Test Script
This script will test your Azure Computer Vision configuration independently
from the main application to verify it's working correctly.
"""
import io
import os
import sys
import logging
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import OperationStatusCodes
from msrest.authentication import CognitiveServicesCredentials
import time
from PIL import Image, ImageDraw, ImageFont

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Import configuration
from config import AZURE_VISION_KEY, AZURE_VISION_ENDPOINT

def test_azure_connection():
    """Test basic connectivity to Azure Computer Vision API"""
    logger.info("=== Testing Azure Computer Vision Connection ===")
    logger.info(f"Endpoint: {AZURE_VISION_ENDPOINT}")
    logger.info(f"Key (first 5 chars): {AZURE_VISION_KEY[:5]}...")
    
    try:
        # Initialize the client
        client = ComputerVisionClient(
            endpoint=AZURE_VISION_ENDPOINT,
            credentials=CognitiveServicesCredentials(AZURE_VISION_KEY)
        )
        logger.info("✅ Successfully initialized Azure Computer Vision client")
        return client
    except Exception as e:
        logger.error(f"❌ Failed to initialize Azure client: {str(e)}")
        return None

def create_test_image():
    """Create a test image with prescription-like text"""
    logger.info("Creating test prescription image...")
    
    # Create a blank image
    width, height = 800, 600
    image = Image.new('RGB', (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(image)
    
    # Try to use a system font or fall back to default
    try:
        font = ImageFont.truetype("arial.ttf", 20)
    except:
        font = ImageFont.load_default()
    
    # Draw prescription-like text
    text_lines = [
        "Dr. John Smith, M.D.",
        "123 Medical Center",
        "New York, NY 10001",
        "-----------------------------------",
        "Patient: Jane Doe",
        "Date: March 7, 2025",
        "-----------------------------------",
        "Rx: Lisinopril 10mg",
        "Sig: Take one tablet by mouth daily",
        "Disp: 30 tablets",
        "Refill: 3 times",
        "",
        "Rx: Metformin 500mg",
        "Sig: One tablet twice daily with meals",
        "Disp: 60 tablets",
        "Refill: 2 times",
        "",
        "Rx: Atorvastatin 20mg",
        "Sig: Take one tablet at bedtime",
        "Disp: 30 tablets",
        "Refill: 3 times"
    ]
    
    y_position = 50
    for line in text_lines:
        draw.text((50, y_position), line, fill=(0, 0, 0), font=font)
        y_position += 25
    
    # Save the image
    test_dir = os.path.join(os.path.dirname(__file__), "..", "test_images")
    if not os.path.exists(test_dir):
        os.makedirs(test_dir)
    
    test_image_path = os.path.join(test_dir, "test_prescription.png")
    image.save(test_image_path)
    
    logger.info(f"Test image created: {test_image_path}")
    return test_image_path

def test_ocr(client, image_path):
    """Test OCR functionality with a sample image"""
    if not client:
        logger.error("Cannot test OCR: Client initialization failed")
        return
    
    logger.info(f"=== Testing OCR with image: {image_path} ===")
    
    try:
        # Read the image
        with open(image_path, "rb") as image_file:
            image_data = image_file.read()
        
        # Convert to stream for Azure API
        image_stream = io.BytesIO(image_data)
        
        # Call the Read API
        logger.info("Calling Azure Read API...")
        read_response = client.read_in_stream(image_stream, raw=True)
        
        # Get operation location
        operation_location = read_response.headers["Operation-Location"]
        operation_id = operation_location.split("/")[-1]
        
        # Poll for results
        logger.info(f"Polling for results (operation ID: {operation_id})...")
        max_retries = 10
        polling_interval = 1  # seconds
        
        for i in range(max_retries):
            result = client.get_read_result(operation_id)
            logger.info(f"Poll attempt {i+1}/{max_retries} - Status: {result.status}")
            
            if result.status not in [OperationStatusCodes.running, OperationStatusCodes.not_started]:
                break
            time.sleep(polling_interval)
        
        # Process and display results
        if result.status == OperationStatusCodes.succeeded:
            extracted_text = []
            
            for read_result in result.analyze_result.read_results:
                for line in read_result.lines:
                    extracted_text.append(line.text)
            
            logger.info(f"✅ OCR Successful! Extracted {len(extracted_text)} lines of text")
            logger.info("Sample of extracted text:")
            for i, text in enumerate(extracted_text[:10]):
                logger.info(f"  {i+1}. {text}")
            
            return extracted_text
        else:
            logger.error(f"❌ OCR failed with status: {result.status}")
            return None
            
    except Exception as e:
        logger.error(f"❌ OCR test failed with error: {str(e)}")
        return None

def main():
    """Main test function"""
    print("\n" + "="*50)
    print("AZURE COMPUTER VISION DIAGNOSTIC TEST")
    print("="*50 + "\n")
    
    # Test Azure connection
    client = test_azure_connection()
    
    if client:
        # Create a test image
        test_image = create_test_image()
        
        # Test OCR with the created image
        extracted_text = test_ocr(client, test_image)
        
        if extracted_text:
            print("\n✅ Azure Computer Vision integration is WORKING CORRECTLY!")
            print("Your credentials are valid and OCR is functioning properly.")
            print("The application should now be able to use Azure OCR for prescription analysis.")
        else:
            print("\n❌ Azure OCR test FAILED.")
            print("Check the logs above for specific errors.")
    else:
        print("\n❌ Azure connection test FAILED.")
        print("Unable to initialize Azure client with the provided credentials.")
        print("Please double-check your Azure Vision Key and Endpoint in config.py")
    
    print("\n" + "="*50)
    print("TEST COMPLETED")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
