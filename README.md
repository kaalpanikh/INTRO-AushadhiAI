# AushadhiAI - Intelligent Prescription Analysis

![AushadhiAI Logo](favicon.ico)

## Overview

AushadhiAI is an innovative solution that uses artificial intelligence and Azure Computer Vision to decode doctors' handwritten prescriptions, making medication information accessible and understandable for patients.

## Key Features

- **Prescription Image Analysis**: Upload and process prescription images
- **Azure-Powered OCR**: Extract text from handwritten or printed prescriptions using Azure Computer Vision
- **Medication Identification**: Automatically identify medications mentioned in prescriptions
- **Intuitive UI**: Clean, user-friendly interface for easy interaction
- **Robust Architecture**: Fallback mechanisms ensure functionality even when cloud services are unavailable

## Project Status

### Completed Features
- Azure Computer Vision integration
- Prescription image upload and processing
- OCR text extraction
- Basic medication identification
- Demo interface for presentation
- System diagnostic utilities
- One-command startup script

### In Development
- Detailed medication information (dosage, instructions)
- User accounts and prescription history
- Mobile application
- Pharmacy system integration
- Multi-language support

## Technical Architecture

The application consists of these key components:

- **Frontend**: HTML, CSS, JavaScript
- **Backend API**: FastAPI server providing endpoints for image analysis
- **Azure Vision Service**: Cloud-based OCR through Azure Computer Vision
- **Medication Service**: Logic for identifying medications from extracted text
- **Medication Database**: JSON-based storage of medication information

## Installation

### Prerequisites
- Python 3.8+
- Azure Computer Vision API key and endpoint
- Internet connection for Azure services

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/AushadhiAI.git
   cd AushadhiAI
   ```

2. **Install dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Configure Azure credentials**:
   Edit `backend/config.py` to include your Azure Computer Vision key and endpoint:
   ```python
   AZURE_VISION_KEY = "your_azure_vision_key_here"
   AZURE_VISION_ENDPOINT = "https://your-resource-name.cognitiveservices.azure.com/"
   USE_AZURE_OCR = True  # Set to False to use simulation mode
   ```

## Running the Application

### Quick Start (Recommended)

Use our one-command startup script:
```bash
python start_demo.py
```

This will:
- Start the backend server
- Start the frontend server
- Open the demo interface in your browser
- Display connection status

### Manual Startup

1. **Start the backend server**:
   ```bash
   cd backend
   python -m uvicorn app:app --host 127.0.0.1 --port 8001
   ```

2. **Serve the frontend**:
   ```bash
   # In a new terminal, from the project root
   python -m http.server 8000
   ```

3. **Access the application**:
   - Standard interface: http://localhost:8000
   - Demo interface: http://localhost:8000/demo.html

## Hackathon Presentation Guide

### System Verification

Before your presentation, run our diagnostic tool:
```bash
python system_check.py
```

This will:
- Verify all dependencies are installed
- Check Azure connectivity
- Ensure all required files are present
- Validate API functionality

### Key Demonstration Points

1. **Azure Integration**: Highlight how Azure Computer Vision provides superior OCR accuracy
2. **Error Resilience**: Show the fallback mechanism that keeps the application functional even without Azure
3. **Medication Identification**: Demonstrate the system's ability to recognize medications from prescription text
4. **User Experience**: Emphasize the clean, intuitive interface designed for accessibility

### Presentation Flow

1. Start with the problem statement: Difficulty in understanding doctors' prescriptions
2. Explain how AushadhiAI solves this using AI and Azure services
3. Demo the application with a real prescription image
4. Discuss the technical architecture and challenges overcome
5. Share your vision for future enhancements

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend connection failing | Check that port 8001 is available and not blocked by firewall |
| Azure connectivity issues | Run `python verify_azure.py` to check your credentials |
| "No medications found" error | Ensure the prescription image is clear and well-lit |
| Frontend not loading | Verify that the frontend server is running on port 8000 |

For deeper diagnostics, run:
```bash
python system_check.py
```

## Future Roadmap

- **Enhanced Medication Details**: Include dosage instructions, side effects, and contraindications
- **User Accounts**: Implement login system for saving prescription history
- **Mobile Application**: Develop companion mobile apps for Android and iOS
- **Pharmacy Integration**: Connect with local pharmacies for direct ordering
- **Analytics Dashboard**: Add statistical analysis of medication history
- **Multilingual Support**: Expand language capabilities for international use

## Team

Developed by the AushadhiAI team for the Decode Prescriptions Hackathon 2025.

## License

This project is licensed under the MIT License - see the LICENSE file for details.