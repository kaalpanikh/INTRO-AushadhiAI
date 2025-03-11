# AushadhiAI - Intelligent Prescription Analysis

<div align="center">
  <!-- Logo placeholder -->
  <h1>🔍 AushadhiAI</h1>
  <h3>Decode Prescriptions, Understand Medications</h3>
</div>

## 🔍 Overview

AushadhiAI is an advanced AI-powered solution that decodes doctors' handwritten prescriptions using computer vision and machine learning. The application extracts medication information and presents it in an easy-to-understand format, bridging the knowledge gap between healthcare providers and patients.

## ✨ Key Features

- **Multi-format Image Processing**: Support for JPEG, PNG, and HEIC (iPhone) image formats
- **Advanced OCR**: Extract text from handwritten prescriptions using Azure Computer Vision
- **Medication Identification**: Automatically identify medications using ML-based text analysis
- **Cross-platform Compatibility**: Works across devices including iPhones and Android phones
- **Responsive Design**: Optimized interface for both desktop and mobile use
- **Fault Tolerance**: Robust fallback mechanisms when cloud services are unavailable

## 🏗️ Architecture

AushadhiAI employs a modern, scalable architecture:

- **Frontend**: HTML5, CSS3, JavaScript with responsive design principles
- **Backend API**: FastAPI (Python) providing RESTful endpoints for image analysis
- **Cloud Vision**: Azure Computer Vision API for OCR processing
- **Medication Service**: Custom NLP algorithms for medication identification
- **Container Deployment**: Docker containers for consistent development and production environments
- **Cloud Infrastructure**: AWS EC2 and ECR for reliable, scalable hosting

## 🚀 Deployment Options

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/harryhome1/INTRO-AushadhiAI.git
   cd INTRO-AushadhiAI
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Azure credentials**:
   Create a `backend/config.py` file with your Azure credentials:
   ```python
   # Azure Vision Configuration
   AZURE_VISION_ENDPOINT = "your_endpoint_here"
   AZURE_VISION_KEY = "your_key_here"
   
   # CORS Configuration
   ALLOWED_ORIGINS = ["http://localhost:8000", "http://127.0.0.1:8000"]
   
   # Set to False to use simulated results for development
   USE_AZURE_OCR = True
   ```

4. **Run the backend server**:
   ```bash
   cd backend
   uvicorn app:app --host 0.0.0.0 --port 8007 --reload
   ```

5. **Serve the frontend** (in a new terminal):
   ```bash
   # From project root
   python -m http.server 8000
   ```

6. **Access the application**:
   Open your browser and navigate to `http://localhost:8000`

### Production Deployment (AWS)

AushadhiAI is designed for containerized deployment on AWS:

1. **Build Docker image**:
   ```bash
   docker build -t aushadhi-backend:latest .
   ```

2. **Push to Amazon ECR**:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 905418100386.dkr.ecr.us-east-1.amazonaws.com
   docker tag aushadhi-backend:latest 905418100386.dkr.ecr.us-east-1.amazonaws.com/aushadhi-backend:latest
   docker push 905418100386.dkr.ecr.us-east-1.amazonaws.com/aushadhi-backend:latest
   ```

3. **Deploy on EC2**:
   ```bash
   docker pull 905418100386.dkr.ecr.us-east-1.amazonaws.com/aushadhi-backend:latest
   docker run -d --name aushadhi-backend -p 8007:8007 905418100386.dkr.ecr.us-east-1.amazonaws.com/aushadhi-backend:latest
   ```

4. **Configure NGINX** (recommended for production):
   ```nginx
   server {
       listen 80;
       server_name aiapi.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:8007;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## 📱 iPhone Support

AushadhiAI includes special handling for iPhone image formats:

1. **HEIC Processing**: Native support for Apple's High Efficiency Image Format
2. **Format Detection**: Automatic identification of image types
3. **Conversion Pipeline**: Fallback conversion when needed

Note for iPhone users: For best results, you can set your iPhone to capture in "Most Compatible" format:
- Go to Settings > Camera > Formats
- Select "Most Compatible" instead of "High Efficiency"

## 🛠️ Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   - Ensure the backend server is running on port 8007
   - Check CORS settings if accessing from a different domain
   - Verify network connectivity between frontend and backend

2. **Image Processing Errors**
   - Ensure the image is clear and well-lit
   - Check that the image size is below 5MB
   - For iPhone users, try using JPEG format if HEIC processing fails

3. **No Medications Detected**
   - Verify that the prescription image is legible
   - Ensure the handwriting is clear
   - Try using the sample prescription for testing

### Health Check

To verify the backend is functioning properly:
```bash
curl https://aiapi.yourdomain.com/api/health
```

Expected response:
```json
{"status":"healthy","services":{"ocr":"active","medication_db":"active","api":"active"}}
```

## 📄 API Documentation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Check system health |
| `/api/analyze` | POST | Analyze prescription image |

Example analysis request:
```bash
curl -X POST https://aiapi.yourdomain.com/api/analyze \
  -F "file=@prescription.jpg"
```

## 🔮 Future Development

- **Enhanced Medication Database**: Expanding coverage to more medications
- **Dosage Recognition**: Identifying dosage instructions from prescriptions
- **Drug Interaction Warnings**: Alert users to potential medication interactions
- **Patient Profiles**: Save prescription history and medication tracking
- **Multilingual Support**: Add support for prescriptions in multiple languages

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Team

- Nikhil Mishra - Project Lead & Developer