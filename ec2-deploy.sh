#!/bin/bash

# EC2 deployment script for AushadhiAI Backend
# This script pulls the latest Docker image from ECR and runs it

# Set variables
AWS_REGION="us-east-1"  # Change to your AWS region
ECR_URI="905418100386.dkr.ecr.us-east-1.amazonaws.com"  # Change to your ECR URI
IMAGE_NAME="aushadhi-backend"
IMAGE_TAG="latest"  # Can be changed to a specific tag if needed
CONTAINER_NAME="aushadhi-backend"
APP_PORT=8007

# Install dependencies if not already installed
if ! command -v docker &> /dev/null; then
  echo "Docker not found. Installing Docker..."
  sudo apt-get update
  sudo apt-get install -y docker.io
  sudo systemctl start docker
  sudo systemctl enable docker
  sudo usermod -aG docker $USER
  echo "Please log out and log back in to apply docker group changes, then run this script again."
  exit 1
fi

if ! command -v aws &> /dev/null; then
  echo "AWS CLI not found. Installing AWS CLI..."
  curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
  unzip awscliv2.zip
  sudo ./aws/install
  rm -rf aws awscliv2.zip
fi

# Configure AWS credentials if needed
# aws configure

# Login to ECR
echo "Logging in to Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI

# Check if the container is already running
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
  echo "Stopping existing $CONTAINER_NAME container..."
  docker stop $CONTAINER_NAME
  docker rm $CONTAINER_NAME
fi

# Pull the latest image
echo "Pulling the latest Docker image from ECR..."
docker pull $ECR_URI/$IMAGE_NAME:$IMAGE_TAG

# Run the container
echo "Starting the container..."
docker run -d \
  --name $CONTAINER_NAME \
  -p $APP_PORT:$APP_PORT \
  -e AZURE_VISION_ENDPOINT="https://aushadhiai-computervision.cognitiveservices.azure.com/" \
  -e AZURE_VISION_KEY="1BUzJ4Dr444av4ikJ3X3qfb9bpFeKodrjCNrBtUEALstuNIqecUJJQQJ99BCACYeBjFXJ3w3AAAFACOGxnpP" \
  -e ALLOWED_ORIGINS="https://harryhome1.github.io/INTRO-AushadhiAI,http://localhost:8006" \
  $ECR_URI/$IMAGE_NAME:$IMAGE_TAG

# Check if container started successfully
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
  echo "Container started successfully!"
  echo "The application is now running on port $APP_PORT"
  echo "You can check the logs with: docker logs $CONTAINER_NAME"
else
  echo "Failed to start the container. Check the logs for more information."
  docker logs $CONTAINER_NAME
fi 