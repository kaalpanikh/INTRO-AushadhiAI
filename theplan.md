# AushadhiAI: Streamlined Implementation Plan for 1-Day Hackathon

## Overview
This plan outlines the focused development roadmap for AushadhiAI, a prescription recognition and medication information system, tailored for a 1-day hackathon.

## 1. Simplified Project Structure

### Backend Structure
```
backend/
├── app.py             # FastAPI application with all endpoints
├── services/
│   ├── ocr_service.py # OCR processing
│   └── med_service.py # Medication matching
├── data/
│   └── medications.json # Medication database (5-10 common medications)
└── requirements.txt   # Minimal dependencies
```

### Frontend Structure
```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Upload.jsx    # Prescription upload component
│   │   └── Results.jsx   # Results display component
│   ├── App.jsx           # Main application component
│   └── index.jsx         # Entry point
├── package.json
└── vite.config.js
```

### Core Dependencies

**Backend:**
```python
# requirements.txt
fastapi==0.100.0
uvicorn==0.22.0
python-multipart==0.0.6
easyocr==1.7.0
pillow==10.0.0
numpy==1.25.1
fuzzywuzzy==0.18.0
python-Levenshtein==0.21.1
```

**Frontend:**
```javascript
// Core package.json dependencies
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.4.0",
    "tailwindcss": "^3.3.3"
  }
}
```

## 2. Backend Implementation

### 2.1 FastAPI Application (app.py)
```python
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.ocr_service import OCRService
from services.med_service import MedicationService
import uvicorn

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with specific origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ocr_service = OCRService()
med_service = MedicationService()

@app.get("/")
async def root():
    return {"message": "AushadhiAI API is running"}

@app.post("/api/analyze")
async def analyze_prescription(file: UploadFile = File(...)):
    """Analyze a prescription image and identify medications"""
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images are supported")
    
    content = await file.read()
    
    try:
        # Extract text from image
        ocr_results = ocr_service.extract_text(content)
        
        # Match medications
        med_names = med_service.get_medication_names()
        medications = ocr_service.identify_medications(ocr_results, med_names)
        
        # Get full medication details
        medication_details = []
        for match in medications:
            med_info = med_service.get_medication_details(match["matched_medication"])
            if med_info:
                medication_details.append({
                    **match,
                    "details": med_info
                })
        
        return {
            "ocr_results": ocr_results,
            "medications": medication_details
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
```

### 2.2 OCR Service (ocr_service.py)
```python
import easyocr
from fuzzywuzzy import process
import re

class OCRService:
    def __init__(self):
        # Initialize EasyOCR with English language
        self.reader = easyocr.Reader(['en'])
    
    def extract_text(self, image_bytes):
        """Extract text from prescription image"""
        results = self.reader.readtext(image_bytes)
        
        # Process results
        extracted_data = [
            {
                "text": item[1],
                "confidence": float(item[2]),
                "box": item[0]
            }
            for item in results
        ]
        
        return extracted_data
    
    def identify_medications(self, ocr_results, med_names):
        """Identify medications in OCR results"""
        # Extract all text from OCR results
        all_text = " ".join([item["text"] for item in ocr_results])
        
        # Split into words and phrases
        words = re.findall(r'\b\w+\b', all_text)
        phrases = []
        
        # Create phrases from consecutive words
        for i in range(len(words)):
            for j in range(1, min(4, len(words) - i + 1)):
                phrases.append(" ".join(words[i:i+j]))
        
        # Find matches using fuzzy matching
        medication_matches = []
        for phrase in phrases:
            if len(phrase) > 3:  # Ignore very short phrases
                match, score = process.extractOne(phrase, med_names)
                if score > 75:  # Threshold for accepting a match
                    medication_matches.append({
                        "extracted_text": phrase,
                        "matched_medication": match,
                        "confidence": score
                    })
        
        # Remove duplicates (keep highest confidence)
        unique_matches = {}
        for match in medication_matches:
            med_name = match["matched_medication"]
            if med_name not in unique_matches or match["confidence"] > unique_matches[med_name]["confidence"]:
                unique_matches[med_name] = match
        
        return list(unique_matches.values())
```

### 2.3 Medication Service (med_service.py)
```python
import json
import os

class MedicationService:
    def __init__(self):
        # Load medication database
        script_dir = os.path.dirname(os.path.abspath(__file__))
        data_path = os.path.join(script_dir, "../data/medications.json")
        
        with open(data_path, 'r') as f:
            self.medications = json.load(f)
    
    def get_medication_names(self):
        """Get list of all medication names for matching"""
        med_names = [med["name"] for med in self.medications]
        # Include aliases
        med_names.extend([alias for med in self.medications for alias in med.get("aliases", [])])
        return med_names
    
    def get_medication_details(self, name):
        """Get detailed information about a medication"""
        # First check exact name match
        for med in self.medications:
            if med["name"].lower() == name.lower():
                return med
            
            # Check aliases
            if "aliases" in med and any(alias.lower() == name.lower() for alias in med["aliases"]):
                return med
        
        return None
```

### 2.4 Simplified Medication Database (medications.json)
```json
[
  {
    "name": "Amoxicillin",
    "aliases": ["Amox", "Amoxil"],
    "type": "Antibiotic",
    "uses": "Treatment of bacterial infections such as bronchitis, pneumonia, and infections of the ear, nose, throat, urinary tract, and skin.",
    "dosage": "250-500mg three times daily for adults",
    "frequency": "Every 8 hours with or without food",
    "sideEffects": [
      "Diarrhea",
      "Stomach upset",
      "Nausea",
      "Rash"
    ],
    "precautions": "Tell your doctor if you have allergies, especially to penicillin."
  },
  {
    "name": "Paracetamol",
    "aliases": ["Acetaminophen", "Tylenol", "Calpol"],
    "type": "Analgesic and antipyretic",
    "uses": "Relief of mild to moderate pain and fever reduction.",
    "dosage": "500-1000mg every 4-6 hours as needed",
    "frequency": "Every 4-6 hours as needed",
    "sideEffects": [
      "Nausea",
      "Rash",
      "Headache"
    ],
    "precautions": "Do not exceed the recommended dose. Avoid alcohol."
  },
  {
    "name": "Lisinopril",
    "aliases": ["Prinivil", "Zestril"],
    "type": "ACE inhibitor",
    "uses": "Treatment of high blood pressure and heart failure.",
    "dosage": "10-40mg once daily",
    "frequency": "Once daily at the same time each day",
    "sideEffects": [
      "Dry cough",
      "Dizziness",
      "Headache",
      "Fatigue"
    ],
    "precautions": "May cause dizziness. Use caution when driving or operating machinery."
  },
  {
    "name": "Metformin",
    "aliases": ["Glucophage"],
    "type": "Antidiabetic",
    "uses": "Treatment of type 2 diabetes.",
    "dosage": "500-1000mg twice daily",
    "frequency": "With meals to minimize stomach upset",
    "sideEffects": [
      "Nausea",
      "Diarrhea",
      "Stomach pain",
      "Metallic taste"
    ],
    "precautions": "Take with food to reduce stomach upset."
  },
  {
    "name": "Atorvastatin",
    "aliases": ["Lipitor"],
    "type": "Statin",
    "uses": "Lowering cholesterol and preventing cardiovascular disease.",
    "dosage": "10-80mg once daily",
    "frequency": "Once daily, preferably in the evening",
    "sideEffects": [
      "Muscle pain",
      "Headache",
      "Digestive issues",
      "Joint pain"
    ],
    "precautions": "Report any unexplained muscle pain, tenderness, or weakness."
  }
]
```

## 3. Frontend Implementation

### 3.1 Upload Component (Upload.jsx)
```jsx
import React, { useState, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Upload = ({ onResultsReceived, setIsLoading, isLoading }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError('');
    
    if (selectedFile) {
      if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) {
        setError('Please upload a JPEG or PNG image');
        return;
      }
      
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (!['image/jpeg', 'image/png'].includes(droppedFile.type)) {
        setError('Please upload a JPEG or PNG image');
        return;
      }
      
      setFile(droppedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(droppedFile);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please upload a prescription image');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(`${API_URL}/api/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      onResultsReceived(response.data);
    } catch (err) {
      console.error('Error analyzing prescription:', err);
      setError('Failed to analyze the prescription. Please try again.');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Upload Your Prescription</h2>
      
      <div 
        className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center cursor-pointer hover:bg-gray-50 transition ${error ? 'border-red-300' : 'border-blue-300'}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept="image/jpeg, image/png" 
          onChange={handleFileChange} 
        />
        
        {preview ? (
          <div>
            <img 
              src={preview} 
              alt="Prescription preview" 
              className="max-h-64 mx-auto rounded-lg mb-4" 
            />
            <p className="text-sm text-gray-500">Click or drag to change image</p>
          </div>
        ) : (
          <div>
            <svg className="w-12 h-12 mx-auto text-blue-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <p className="text-gray-700 mb-2">Drag and drop your prescription image here</p>
            <p className="text-sm text-gray-500">or click to select a file</p>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mb-4 text-red-500 text-sm">{error}</div>
      )}
      
      <button
        onClick={handleSubmit}
        disabled={!file || isLoading}
        className={`w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium ${
          !file || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
        } transition`}
      >
        {isLoading ? 'Analyzing...' : 'Analyze Prescription'}
      </button>
      
      <div className="mt-6 text-sm text-gray-600">
        <p>For best results:</p>
        <ul className="list-disc pl-5 mt-1">
          <li>Ensure good lighting</li>
          <li>Make sure the prescription is clearly visible</li>
          <li>Include the entire prescription in the image</li>
        </ul>
      </div>
    </div>
  );
};

export default Upload;
```

### 3.2 Results Component (Results.jsx)
```jsx
import React from 'react';

const Results = ({ results, onReset }) => {
  if (!results || !results.medications) {
    return (
      <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-lg text-center">
        <p className="text-gray-700 mb-4">No medication information found.</p>
        <button
          onClick={onReset}
          className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Try Another Prescription
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Prescription Analysis Results</h2>
          <button
            onClick={onReset}
            className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition text-sm"
          >
            Analyze Another
          </button>
        </div>
        
        {results.medications.length > 0 ? (
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Identified Medications</h3>
            
            {results.medications.map((med, index) => (
              <div key={index} className="mb-6 p-6 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-semibold text-blue-700">
                    {med.details.name}
                  </h4>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    {Math.round(med.confidence)}% match
                  </span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Type</p>
                    <p className="text-gray-600 mb-3">{med.details.type}</p>
                    
                    <p className="font-medium text-gray-700 mb-1">Uses</p>
                    <p className="text-gray-600 mb-3">{med.details.uses}</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Dosage</p>
                    <p className="text-gray-600 mb-3">{med.details.dosage}</p>
                    
                    <p className="font-medium text-gray-700 mb-1">Frequency</p>
                    <p className="text-gray-600 mb-3">{med.details.frequency || "Not specified"}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="font-medium text-gray-700 mb-1">Side Effects</p>
                  {med.details.sideEffects && med.details.sideEffects.length > 0 ? (
                    <ul className="list-disc pl-5 text-gray-600">
                      {med.details.sideEffects.map((effect, i) => (
                        <li key={i}>{effect}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No side effects listed</p>
                  )}
                </div>
                
                {med.details.precautions && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-md">
                    <p className="font-medium text-gray-700 mb-1">Precautions</p>
                    <p className="text-gray-700">{med.details.precautions}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-yellow-700">
              No medications were identified in this prescription. Please try with a clearer image or a different prescription.
            </p>
          </div>
        )}
        
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-700 mb-4">OCR Text Extraction</h3>
          <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
            {results.ocr_results.map((item, index) => (
              <div key={index} className="mb-2">
                <p className="text-gray-800">
                  {item.text}
                  <span className="ml-2 text-xs text-gray-500">
                    (Confidence: {Math.round(item.confidence * 100)}%)
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
```

## 4. Development Timeline (1 Day)

### Morning (3 hours)
- **Hour 1:** Project setup and scaffolding
  - Create repository structure
  - Set up FastAPI backend
  - Initialize React frontend

- **Hour 2-3:** Backend core functionality
  - Implement OCR service integration
  - Create medication matching algorithm
  - Develop API endpoint for prescription analysis

### Afternoon (4 hours)
- **Hour 4-5:** Frontend development
  - Create upload component
  - Implement results display
  - Connect to backend API
  - Adapt styling from existing landing page

- **Hour 6-7:** Integration and testing
  - Test with real prescription samples
  - Fix bugs and edge cases
  - Improve matching accuracy

### Evening (3 hours)
- **Hour 8-9:** Deployment
  - Deploy backend to Railway
  - Deploy frontend to Vercel
  - Test and fix deployment issues

- **Hour 10:** Final touches and demo preparation
  - Prepare sample prescriptions for demo
  - Create brief presentation slides
  - Test complete flow on deployed application

## 5. Deployment Strategy

### Backend Deployment (Railway)
1. Create a Railway account
2. Connect to GitHub repository
3. Set up Python service
4. Deploy the backend
5. Note the deployed URL for frontend configuration

### Frontend Deployment (Vercel)
1. Create a Vercel account
2. Connect to GitHub repository
3. Set environment variable `VITE_API_URL` to point to backend
4. Deploy the frontend

## 6. Demo Plan

### Presentation Outline (2 minutes)
1. **Introduction (15 seconds)**
   - "AushadhiAI helps patients understand their prescriptions through AI."

2. **Problem Statement (15 seconds)**
   - "Doctors' handwriting can be difficult to interpret, leading to confusion and medication errors."

3. **Demo (1 minute)**
   - Show the landing page
   - Upload a prescription image
   - Explain the results (medications identified, information provided)

4. **Technical Overview (15 seconds)**
   - "We used OCR technology combined with medication matching algorithms to extract and identify drugs."

5. **Closing (15 seconds)**
   - "AushadhiAI empowers patients by giving them clear information about their medications."

### Sample Prescriptions
- Prepare 3-5 clear prescription images with different medications
- Include at least one challenging handwriting sample

## 7. Success Criteria

1. ✅ Working OCR text extraction
2. ✅ Accurate medication identification
3. ✅ Clean, user-friendly interface
4. ✅ Responsive design
5. ✅ Successfully deployed application