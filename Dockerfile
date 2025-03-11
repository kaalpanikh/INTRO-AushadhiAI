FROM python:3.9-slim

WORKDIR /app

# Install system dependencies required for HEIC image processing
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    curl \
    libheif-dev \
    libffi-dev \
    libjpeg-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code
COPY backend/ /app/

# Environment variables that can be overridden during deployment
ENV PORT=8007
ENV HOST="0.0.0.0"
ENV AZURE_VISION_ENDPOINT=""
ENV AZURE_VISION_KEY=""

# Add AWS-specific health check endpoint configuration with more lenient parameters
ENV PYTHONUNBUFFERED=1
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=5 \
  CMD curl -f http://localhost:8007/api/health || exit 1

# Expose the port
EXPOSE 8007

# Launch the app using uvicorn server
CMD uvicorn app:app --host ${HOST} --port ${PORT}
