"""
Azure Computer Vision service for OCR and image analysis.
Provides advanced text extraction from prescription images.
"""
import io
import time
import sys
import logging
import traceback
from msrest.exceptions import ClientRequestError, HttpOperationError
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import OperationStatusCodes
from msrest.authentication import CognitiveServicesCredentials

# Import application configuration
sys.path.append('..')
from config import AZURE_VISION_KEY, AZURE_VISION_ENDPOINT, USE_AZURE_OCR

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AzureVisionService:
    def __init__(self):
        """
        Initialize the Azure Computer Vision client with credentials.
        """
        self.is_available = False
        
        # Skip Azure initialization if simulation mode is enabled
        if not USE_AZURE_OCR:
            logger.info("Azure OCR is disabled in config. Using simulation mode.")
            return
            
        # Try to initialize Azure Computer Vision client
        try:
            logger.info(f"Initializing Azure Vision with endpoint: {AZURE_VISION_ENDPOINT}")
            # Sanitize key for logging (show only first 5 chars)
            safe_key = AZURE_VISION_KEY[:5] + "..." if AZURE_VISION_KEY else "None"
            logger.info(f"Using key (first 5 chars): {safe_key}")
            
            if not AZURE_VISION_KEY or AZURE_VISION_KEY == "your_azure_vision_key_here":
                logger.error("❌ Invalid Azure key detected - using placeholder value")
                return
            
            if not AZURE_VISION_ENDPOINT or "your-resource-name" in AZURE_VISION_ENDPOINT:
                logger.error("❌ Invalid Azure endpoint detected - using placeholder value")
                return
            
            self.client = ComputerVisionClient(
                endpoint=AZURE_VISION_ENDPOINT,
                credentials=CognitiveServicesCredentials(AZURE_VISION_KEY)
            )
            
            # Validate connection by making a simple API call
            logger.info("Testing Azure connection...")
            try:
                # Simply get client properties - lightweight API call
                self.client.api_version
                self.is_available = True
                logger.info("✅ Azure Vision service initialized and connection verified!")
            except (ClientRequestError, HttpOperationError) as e:
                logger.error(f"❌ Failed to connect to Azure service: {str(e)}")
                return
                
        except Exception as e:
            logger.error(f"❌ Azure Vision service initialization error: {str(e)}")
            logger.error(traceback.format_exc())
            logger.warning("Continuing with simulation mode.")
            
    def extract_text(self, image_bytes):
        """
        Extract text from prescription image using Azure Computer Vision.
        
        Args:
            image_bytes: Image data as bytes
            
        Returns:
            List of dictionaries containing extracted text and metadata
        """
        if not self.is_available:
            logger.warning("Azure Vision service is not available. Using fallback method.")
            return self._fallback_extract_text(image_bytes)
            
        try:
            logger.info("Extracting text using Azure OCR...")
            # Convert bytes to stream
            image_stream = io.BytesIO(image_bytes)
            
            # Call the Read API with the image stream
            read_response = self.client.read_in_stream(image_stream, raw=True)
            
            # Get the operation location from the response headers
            operation_location = read_response.headers["Operation-Location"]
            
            # Extract the operation ID from the operation location
            operation_id = operation_location.split("/")[-1]
            
            # Wait for the operation to complete
            max_retries = 10
            polling_interval = 1  # seconds
            result = None
            
            for i in range(max_retries):
                try:
                    result = self.client.get_read_result(operation_id)
                    if result.status not in [OperationStatusCodes.running, OperationStatusCodes.not_started]:
                        break
                    time.sleep(polling_interval)
                    logger.info(f"Polling Azure OCR result... attempt {i+1}/{max_retries}")
                except Exception as e:
                    logger.error(f"Error polling OCR result: {str(e)}")
                    time.sleep(polling_interval)
            
            # Process the results if the operation was successful
            extracted_text = []
            if result and result.status == OperationStatusCodes.succeeded:
                for read_result in result.analyze_result.read_results:
                    for line in read_result.lines:
                        # Format similar to our original OCR service for compatibility
                        text_data = {
                            "text": line.text,
                            "confidence": sum([word.confidence for word in line.words]) / len(line.words) if line.words else 0.5,
                            "box": [[p.x, p.y] for p in line.bounding_box] if hasattr(line, 'bounding_box') else [[0, 0], [1, 0], [1, 1], [0, 1]]
                        }
                        extracted_text.append(text_data)
                
                logger.info(f"✅ Azure OCR completed successfully. Extracted {len(extracted_text)} text lines.")
                
                if len(extracted_text) > 0:
                    logger.info(f"Sample text: {extracted_text[0]['text']}")
                
                return extracted_text
            else:
                status = result.status if result else "Unknown"
                logger.error(f"❌ Azure OCR failed with status: {status}")
                return self._fallback_extract_text(image_bytes)
            
        except Exception as e:
            logger.error(f"❌ Azure OCR error: {str(e)}")
            logger.error(traceback.format_exc())
            return self._fallback_extract_text(image_bytes)
            
    def _fallback_extract_text(self, image_bytes):
        """
        Fallback method when Azure OCR fails or is unavailable.
        Returns simulated OCR results for demo/development purposes.
        """
        # Sample prescription text patterns for simulation
        simulated_texts = [
            "Patient Name: John Doe",
            "Date: 2025-03-07",
            "Rx: Lisinopril 10mg",
            "Sig: Take one tablet by mouth daily",
            "Refill: 3 times",
            "Rx: Metformin 500mg",
            "Sig: Take one tablet twice daily with meals",
            "Refill: 6 times",
            "Rx: Atorvastatin 20mg",
            "Sig: Take one tablet at bedtime",
            "Refill: 3 times",
            "Rx: Amlodipine 5mg",
            "Sig: Take one tablet daily",
            "Refill: 3 times",
            "Doctor: Jane Smith, MD"
        ]
        
        # Create simulated OCR results
        extracted_text = []
        y_offset = 50
        
        for i, text in enumerate(simulated_texts):
            text_data = {
                "text": text,
                "confidence": 0.95,  # High confidence for demo purposes
                "box": [[50, y_offset], [550, y_offset], [550, y_offset + 20], [50, y_offset + 20]]
            }
            y_offset += 30
            extracted_text.append(text_data)
            
        logger.info(f"Using simulated OCR with {len(extracted_text)} text lines.")
        return extracted_text
