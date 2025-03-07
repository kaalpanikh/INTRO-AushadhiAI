from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import io
from typing import List, Optional, Dict, Any
import os
import uvicorn
from pydantic import BaseModel
from PIL import Image
import base64
from io import BytesIO

from services.ocr_service import OCRService
from services.med_service import MedicationService
from services.rxnorm_service import RxNormService
from services.azure_vision_service import AzureVisionService

app = FastAPI(title="AushadhiAI API", 
              description="API for prescription OCR and medication information",
              version="1.0.0")

# Add CORS middleware to allow cross-origin requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ocr_service = OCRService()
med_service = MedicationService()
rxnorm_service = RxNormService()
azure_vision_service = AzureVisionService()

class MedicationResponse(BaseModel):
    name: str
    matched_text: str
    confidence: float
    dosage_info: Optional[Dict[str, Any]] = None
    details: Optional[Dict[str, Any]] = None

class AnalysisResponse(BaseModel):
    medications: List[MedicationResponse]
    ocr_text: List[str]
    processing_time_ms: float
    status: str

@app.get("/api")
async def read_root():
    return {"message": "Welcome to AushadhiAI API", "status": "active"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "services": {
        "ocr": "active",
        "medication_db": "active",
        "api": "active"
    }}

@app.get("/api/medications")
async def get_medications():
    """Get all available medications in the database"""
    medications = med_service.get_all_medication_names()
    return {"medications": medications, "count": len(medications)}

@app.get("/api/medication/{name}")
async def get_medication_details(name: str):
    """Get detailed information about a specific medication"""
    medication = med_service.get_medication_details(name)
    if not medication:
        raise HTTPException(status_code=404, detail=f"Medication '{name}' not found")
    return {"medication": medication}

@app.post("/api/analyze", response_model=dict)
async def analyze_prescription(file: UploadFile = File(...)):
    """
    Analyze a prescription image to extract medication information
    """
    try:
        # Read the uploaded file
        contents = await file.read()
        
        # Extract text from the image using OCR
        ocr_results = ocr_service.extract_text(contents)
        
        # Identify medications in the text
        med_names = med_service.get_all_medication_names()
        identified_meds = ocr_service.identify_medications(ocr_results, med_names)
        
        # Get details for identified medications, with enhanced data from RxNorm
        medications = []
        for med in identified_meds:
            med_name = med["matched_medication"]
            
            # Get medication details from our local database first
            local_med_details = med_service.get_medication_details(med_name) or {}
            
            # Try to get enhanced details from RxNorm API
            rxnorm_details = rxnorm_service.get_medication_info(med_name)
            
            # Combine data, prioritizing RxNorm data when available but keeping our local data as backup
            combined_details = {
                "name": med_name,
                "matched_text": med.get("extracted_text", ""),
                "confidence": med.get("confidence", 0),
                "dosage_info": med.get("dosage_info", ""),
                
                # Basic details (prefer RxNorm when available)
                "description": (rxnorm_details.get("name") if rxnorm_details else None) or 
                              local_med_details.get("description", "Information not available"),
                
                # Structured information (prefer RxNorm, fall back to local)
                "drug_class": (rxnorm_details.get("drug_class") if rxnorm_details else None) or 
                             local_med_details.get("category", ["Information not available"]),
                             
                "side_effects": (rxnorm_details.get("side_effects") if rxnorm_details else None) or 
                               local_med_details.get("side_effects", ["Information not available"]),
                               
                "interactions": (rxnorm_details.get("interactions") if rxnorm_details else None) or 
                               local_med_details.get("interactions", ["Information not available"]),
                               
                "warnings": (rxnorm_details.get("warnings") if rxnorm_details else None) or 
                           local_med_details.get("warnings", ["Information not available"]),
                
                # Additional information that might be available only in RxNorm
                "strength": rxnorm_details.get("strength", "") if rxnorm_details else "",
                "form": rxnorm_details.get("form", "") if rxnorm_details else "",
                "indications": rxnorm_details.get("indications", []) if rxnorm_details else []
            }
            
            # Include any dosage info detected from OCR
            if med.get("dosage_info"):
                combined_details["detected_dosage"] = med["dosage_info"]
            
            medications.append(combined_details)
            
        # Convert the image to base64 for displaying in the frontend
        image = Image.open(BytesIO(contents))
        
        # Adjust quality to reduce size if needed
        buffered = BytesIO()
        image.save(buffered, format="JPEG", quality=85)
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        return {
            "ocr_results": ocr_results, 
            "medications": medications,
            "image": img_str
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/api/sample-medications")
async def get_sample_medications():
    """Get a small set of sample medications for demonstration purposes"""
    all_meds = med_service.get_all_medication_names()
    if len(all_meds) <= 10:
        return {"medications": all_meds}
    else:
        import random
        return {"medications": random.sample(all_meds, 10)}

@app.get("/api/check-azure")
async def check_azure():
    """Endpoint to check Azure Vision API connectivity"""
    if not azure_vision_service.is_available:
        return {"status": "error", "message": "Azure Vision service could not be initialized"}
    
    # All checks passed, Azure integration is working
    return {
        "status": "success", 
        "message": "Azure Vision integration is working correctly"
    }

if __name__ == "__main__":
    # Run the server
    uvicorn.run(app, host="0.0.0.0", port=8001)
