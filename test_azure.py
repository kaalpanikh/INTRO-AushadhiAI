"""
Standalone Azure Computer Vision Test
This script provides a comprehensive test of your Azure Computer Vision integration
without relying on the full application. It creates a test image and runs OCR on it.
"""

import os
import sys
import time
import logging
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add the backend directory to Python path for importing config
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    # Import Azure-specific libraries
    from azure.cognitiveservices.vision.computervision import ComputerVisionClient
    from azure.cognitiveservices.vision.computervision.models import OperationStatusCodes
    from msrest.authentication import CognitiveServicesCredentials
    from msrest.exceptions import ClientRequestError, HttpOperationError
    
    # Import application configuration
    from config import AZURE_VISION_KEY, AZURE_VISION_ENDPOINT
    
    azure_available = True
    logger.info("Azure libraries successfully imported")
except ImportError:
    azure_available = False
    logger.error("Failed to import Azure libraries. Please run: pip install azure-cognitiveservices-vision-computervision msrest")

def create_test_image():
    """Create a test image with prescription-like text for OCR testing"""
    logger.info("Creating test prescription image...")
    
    # Create a blank white image
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
    
    # Create test_images directory if it doesn't exist
    test_dir = os.path.join(os.path.dirname(__file__), "test_images")
    if not os.path.exists(test_dir):
        os.makedirs(test_dir)
    
    # Save the image
    test_image_path = os.path.join(test_dir, "test_prescription.png")
    image.save(test_image_path)
    
    logger.info(f"Test image created: {test_image_path}")
    return test_image_path, image

def test_azure_connection():
    """Test basic connectivity to Azure Computer Vision API"""
    logger.info("\n=== Testing Azure Computer Vision Connection ===")
    logger.info(f"Endpoint: {AZURE_VISION_ENDPOINT}")
    # Only show first 5 chars of key for security
    if AZURE_VISION_KEY:
        safe_key = AZURE_VISION_KEY[:5] + "..." 
        logger.info(f"Using key (first 5 chars): {safe_key}")
    else:
        logger.info("No key provided")
    
    # Validation checks
    if not AZURE_VISION_KEY or AZURE_VISION_KEY == "your_azure_vision_key_here":
        logger.error("❌ Invalid Azure key detected. Please update your config.py with a valid key.")
        return None
        
    if not AZURE_VISION_ENDPOINT or "your-resource-name" in AZURE_VISION_ENDPOINT:
        logger.error("❌ Invalid Azure endpoint detected. Please update your config.py with a valid endpoint.")
        return None
    
    try:
        # Initialize the client
        client = ComputerVisionClient(
            endpoint=AZURE_VISION_ENDPOINT,
            credentials=CognitiveServicesCredentials(AZURE_VISION_KEY)
        )
        
        # Test the connection with a lightweight API call
        client.api_version  # This just accesses a property to test connectivity
        
        logger.info("✅ Successfully initialized Azure Computer Vision client")
        return client
    except Exception as e:
        logger.error(f"❌ Failed to initialize Azure client: {str(e)}")
        return None

def perform_ocr_test(client, test_image_path, test_image):
    """Test OCR functionality with the test image"""
    if not client:
        logger.error("Cannot test OCR: Azure client initialization failed")
        return False
    
    logger.info("\n=== Testing OCR with generated prescription image ===")
    
    try:
        # Convert PIL Image to bytes for Azure API
        image_bytes = BytesIO()
        test_image.save(image_bytes, format='PNG')
        image_bytes.seek(0)  # Go to the beginning of BytesIO object
        
        # Call the Read API
        logger.info("Calling Azure Read API...")
        read_response = client.read_in_stream(image_bytes, raw=True)
        
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
            
            logger.info(f"\n✅ OCR Successful! Extracted {len(extracted_text)} lines of text")
            logger.info("Sample of extracted text:")
            for i, text in enumerate(extracted_text[:10]):
                logger.info(f"  {i+1}. {text}")
            
            return True
        else:
            logger.error(f"\n❌ OCR failed with status: {result.status}")
            return False
            
    except Exception as e:
        logger.error(f"\n❌ OCR test failed with error: {str(e)}")
        return False

def main():
    """Main test function with comprehensive error checking"""
    print("\n" + "="*60)
    print("  AZURE COMPUTER VISION INTEGRATION TEST FOR AUSHADHI AI")
    print("="*60)
    
    # Check if Azure libraries are available
    if not azure_available:
        print("\n❌ Azure libraries not installed. Please run:")
        print("   pip install azure-cognitiveservices-vision-computervision msrest")
        return
    
    # Create test image
    try:
        test_image_path, test_image = create_test_image()
    except Exception as e:
        logger.error(f"Failed to create test image: {str(e)}")
        print("\n❌ Could not create test image. See log for details.")
        return
    
    # Test Azure connection
    client = test_azure_connection()
    
    if client:
        # Test OCR
        success = perform_ocr_test(client, test_image_path, test_image)
        
        if success:
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
    
    print("\n" + "="*60)
    print("  TEST COMPLETED")
    print("="*60)

if __name__ == "__main__":
    main()
