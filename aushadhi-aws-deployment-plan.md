# AushadhiAI Deployment Plan: GitHub Pages + AWS

This document outlines the complete deployment process for AushadhiAI, using GitHub Pages for the frontend and AWS Elastic Beanstalk for the containerized backend.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [1. Repository Preparation](#1-repository-preparation)
- [2. AWS Infrastructure Setup](#2-aws-infrastructure-setup)
- [3. GitHub Repository Configuration](#3-github-repository-configuration)
- [4. Deployment Process](#4-deployment-process)
- [5. Post-Deployment Configuration](#5-post-deployment-configuration)
- [6. Testing and Verification](#6-testing-and-verification)
- [7. Troubleshooting](#7-troubleshooting)
- [8. Enhancements and Next Steps](#8-enhancements-and-next-steps)
- [File References](#file-references)

## Architecture Overview

```
┌─────────────────┐      HTTPS      ┌──────────────────┐
│                 │  ───────────►   │                  │
│  GitHub Pages   │                 │  AWS Elastic     │
│  (Frontend)     │  ◄───────────   │  Beanstalk       │
│                 │      REST       │  (Backend API)   │
└─────────────────┘                 └──────────────────┘
         ▲                                   ▲
         │                                   │
         │ CI/CD                             │ CI/CD
         │                                   │
         ▼                                   ▼
┌─────────────────┐                 ┌──────────────────┐
│                 │                 │                  │
│  GitHub Actions │                 │  Amazon ECR      │
│  (Frontend)     │                 │  (Container      │
│                 │                 │   Registry)      │
└─────────────────┘                 └──────────────────┘
```

**Key Components:**
- **Frontend**: Static HTML/CSS/JS hosted on GitHub Pages
- **Backend**: Python FastAPI application running in Docker on AWS Elastic Beanstalk
- **CI/CD**: GitHub Actions for automated deployment
- **Container Registry**: Amazon ECR for storing Docker images

## Prerequisites

Before starting, ensure you have:

1. **AWS Account** with access to:
   - Elastic Beanstalk
   - ECR (Elastic Container Registry)
   - IAM (Identity and Access Management)
   - S3 (Simple Storage Service)
   - CloudWatch

2. **GitHub Account** with:
   - Repository for the AushadhiAI application
   - Permissions to configure GitHub Actions and repository settings

3. **Local Development Environment** with:
   - Git
   - AWS CLI
   - Docker (for local testing)
   - Text editor

4. **API Keys and Credentials**:
   - Azure Vision API key and endpoint (used by the application)

## 1. Repository Preparation

### 1.1 Core Files Structure

Your repository should have this structure:
```
/
├── backend/            # Backend Python application
├── assets/             # Frontend assets (images, etc.)
├── .github/workflows/  # GitHub Actions workflow files
├── index.html          # Main frontend page
├── script.js           # Frontend JavaScript
├── styles.css          # Frontend styles
├── Dockerfile          # Docker configuration for backend
├── requirements.txt    # Python dependencies
├── .dockerignore       # Files to exclude from Docker
└── .env.example        # Example environment variables
```

### 1.2 Docker Configuration

Ensure your `Dockerfile` is properly configured:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

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

# Add AWS-specific health check endpoint configuration
ENV PYTHONUNBUFFERED=1
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8007/api/health || exit 1

# Expose the port
EXPOSE 8007

# Launch the app using uvicorn server
CMD uvicorn app:app --host ${HOST} --port ${PORT}
```

Create a `.dockerignore` file:

```
.git
.github
.gitignore
.idea
.vscode
__pycache__/
*.py[cod]
*$py.class
*.so
.env
env/
venv/
ENV/
node_modules/
frontend/
*.log
```

### 1.3 Python Dependencies

Ensure your `requirements.txt` contains all necessary dependencies:

```
fastapi==0.104.1
uvicorn==0.23.2
python-multipart==0.0.6
pillow==10.0.0
requests==2.31.0
python-dotenv==1.0.0
opencv-python==4.8.0.76
numpy==1.25.2
httpx==0.24.1
pydantic==2.4.2
azure-cognitiveservices-vision-computervision==0.9.0
azure-core==1.29.3
fuzzywuzzy==0.18.0
python-Levenshtein==0.21.1
```

### 1.4 GitHub Actions Workflows

Create GitHub Actions workflow files:

#### Frontend Deployment Workflow (`.github/workflows/deploy-frontend.yml`):

```yaml
name: Deploy Frontend to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Pages
        uses: actions/configure-pages@v3
      
      - name: Update API URL for production
        run: |
          # Replace the API_URL with the AWS Elastic Beanstalk production URL
          # The format is typically http://[environment-name].[region].elasticbeanstalk.com
          sed -i 's|const API_URL = .*|const API_URL = "http://aushadhi-production.us-east-1.elasticbeanstalk.com";|g' script.js
          sed -i 's|const API_URL = .*|const API_URL = "http://aushadhi-production.us-east-1.elasticbeanstalk.com";|g' index.html
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: '.'
          
  deploy:
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

#### Backend Deployment Workflow (`.github/workflows/deploy-backend-aws.yml`):

```yaml
name: Deploy Backend to AWS

on:
  push:
    branches: [ main ]
    paths:
      - 'backend/**'
      - 'Dockerfile'
      - 'requirements.txt'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}
          
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
        
      - name: Build, tag, and push image to Amazon ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: aushadhi-backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
          echo "::set-output name=image::$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG"
          
      - name: Generate Dockerrun.aws.json
        run: |
          cat > Dockerrun.aws.json << EOF
          {
            "AWSEBDockerrunVersion": "1",
            "Image": {
              "Name": "${{ steps.login-ecr.outputs.registry }}/aushadhi-backend:${{ github.sha }}",
              "Update": "true"
            },
            "Ports": [
              {
                "ContainerPort": 8007,
                "HostPort": 8007
              }
            ],
            "Volumes": [],
            "Logging": "/var/log"
          }
          EOF
          
      - name: Deploy to Elastic Beanstalk
        uses: einaregilsson/beanstalk-deploy@v20
        with:
          aws_access_key: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws_secret_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          application_name: aushadhi-backend
          environment_name: aushadhi-production
          version_label: aushadhi-${{ github.sha }}
          region: ${{ secrets.AWS_REGION }}
          deployment_package: Dockerrun.aws.json
          existing_bucket_name: ${{ secrets.AWS_S3_BUCKET }}
```

## 2. AWS Infrastructure Setup

### 2.1 Create IAM User for GitHub Actions

This user will have permissions to deploy to ECR and Elastic Beanstalk.

```bash
# Create IAM user for GitHub Actions
aws iam create-user --user-name github-actions-aushadhi

# Create policy document for GitHub Actions permissions
cat > github-actions-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "elasticbeanstalk:*",
        "s3:*",
        "ec2:*",
        "elasticloadbalancing:*",
        "autoscaling:*",
        "cloudwatch:*",
        "logs:*",
        "ecr:*"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Create the policy
aws iam create-policy --policy-name AushadhiGitHubActionsPolicy --policy-document file://github-actions-policy.json

# Get your AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)

# Attach the policy to the user
aws iam attach-user-policy --user-name github-actions-aushadhi --policy-arn arn:aws:iam::$AWS_ACCOUNT_ID:policy/AushadhiGitHubActionsPolicy

# Create access key for the user
aws iam create-access-key --user-name github-actions-aushadhi
# IMPORTANT: Save the output of this command - you will need AccessKeyId and SecretAccessKey for GitHub Secrets
```

### 2.2 Create S3 Bucket for Elastic Beanstalk Deployments

```bash
# Set your AWS region
AWS_REGION="us-east-1"  # Change to your preferred region

# Create S3 bucket with unique name
S3_BUCKET_NAME="aushadhi-eb-deployments-$AWS_ACCOUNT_ID"
aws s3 mb s3://$S3_BUCKET_NAME --region $AWS_REGION
```

### 2.3 Create ECR Repository

```bash
# Create ECR repository for the container images
aws ecr create-repository --repository-name aushadhi-backend --image-scanning-configuration scanOnPush=true
```

### 2.4 Create Elastic Beanstalk Application and Environment

```bash
# Create Elastic Beanstalk application
aws elasticbeanstalk create-application --application-name aushadhi-backend --description "AushadhiAI Backend API"

# Create options configuration file
cat > eb-options.json << 'EOF'
[
  {
    "Namespace": "aws:autoscaling:launchconfiguration",
    "OptionName": "IamInstanceProfile",
    "Value": "aws-elasticbeanstalk-ec2-role"
  },
  {
    "Namespace": "aws:elasticbeanstalk:application:environment",
    "OptionName": "AZURE_VISION_ENDPOINT",
    "Value": "https://your-vision-service.cognitiveservices.azure.com/"
  },
  {
    "Namespace": "aws:elasticbeanstalk:application:environment",
    "OptionName": "AZURE_VISION_KEY",
    "Value": "your-vision-api-key"
  },
  {
    "Namespace": "aws:elasticbeanstalk:application:environment",
    "OptionName": "ALLOWED_ORIGINS",
    "Value": "https://harryhome1.github.io,http://localhost:8006"
  },
  {
    "Namespace": "aws:elasticbeanstalk:environment",
    "OptionName": "EnvironmentType",
    "Value": "SingleInstance"
  },
  {
    "Namespace": "aws:elasticbeanstalk:environment",
    "OptionName": "ServiceRole",
    "Value": "aws-elasticbeanstalk-service-role"
  }
]
EOF

# Replace the placeholder values with your actual values
sed -i 's|https://your-vision-service.cognitiveservices.azure.com/|YOUR_ACTUAL_VISION_ENDPOINT|g' eb-options.json
sed -i 's|your-vision-api-key|YOUR_ACTUAL_VISION_API_KEY|g' eb-options.json
sed -i 's|https://harryhome1.github.io|YOUR_GITHUB_PAGES_URL|g' eb-options.json

# Create Elastic Beanstalk environment
aws elasticbeanstalk create-environment \
  --application-name aushadhi-backend \
  --environment-name aushadhi-production \
  --solution-stack-name "64bit Amazon Linux 2 v3.5.1 running Docker" \
  --option-settings file://eb-options.json
```

## 3. GitHub Repository Configuration

### 3.1 Set Up GitHub Secrets

In your GitHub repository, go to Settings → Secrets and variables → Actions, and add these secrets:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `AWS_ACCESS_KEY_ID` | IAM user access key | `AKIA1234567890ABCDEF` |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_S3_BUCKET` | S3 bucket for deployments | `aushadhi-eb-deployments-123456789012` |

### 3.2 Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to Settings → Pages
3. Under "Source", select "GitHub Actions"

### 3.3 Update API Endpoints

Make sure your frontend code is configured to use environment-specific API endpoints:

In `script.js` and any other frontend files, ensure the API URL is configurable:

```javascript
// API Configuration - will be updated during deployment
const API_URL = 'http://localhost:8007';
// For production deployment, set API_BASE_URL to your AWS endpoint
// const API_URL = 'http://aushadhi-production.us-east-1.elasticbeanstalk.com';
```

## 4. Deployment Process

### 4.1 Initial Deployment

1. **Commit and Push All Changes**:
   ```bash
   git add .
   git commit -m "Configure for AWS deployment"
   git push origin main
   ```

2. **Trigger Backend Deployment**:
   - Go to Actions tab in your GitHub repository
   - Select "Deploy Backend to AWS" workflow
   - Click "Run workflow" and select the main branch

3. **Monitor Backend Deployment**:
   - Check the workflow logs in GitHub Actions
   - Verify deployment status in AWS Elastic Beanstalk console
   - Note the Elastic Beanstalk URL (e.g., `http://aushadhi-production.us-east-1.elasticbeanstalk.com`)

4. **Update Frontend Configuration**:
   - Update the deployed backend URL in the GitHub workflow file:
   ```bash
   # In .github/workflows/deploy-frontend.yml
   sed -i 's|http://aushadhi-production.us-east-1.elasticbeanstalk.com|YOUR_ACTUAL_EB_URL|g' .github/workflows/deploy-frontend.yml
   git add .github/workflows/deploy-frontend.yml
   git commit -m "Update backend URL in frontend deployment"
   git push origin main
   ```

5. **Trigger Frontend Deployment**:
   - Go to Actions tab in your GitHub repository
   - Select "Deploy Frontend to GitHub Pages" workflow
   - Click "Run workflow" and select the main branch

6. **Monitor Frontend Deployment**:
   - Check the workflow logs in GitHub Actions
   - Once complete, your site will be available at: `https://harryhome1.github.io/INTRO-AushadhiAI/`

### 4.2 Continuous Deployment

After initial setup, deployments will be triggered automatically:

- **Backend**: When changes are made to files in the `backend/` directory, `Dockerfile`, or `requirements.txt`
- **Frontend**: When any changes are pushed to the main branch

For manual deployments, you can use the "Run workflow" button in the GitHub Actions tab.

## 5. Post-Deployment Configuration

### 5.1 Set Up CloudWatch Monitoring

Create a CloudWatch dashboard to monitor your application:

```bash
# Create CloudWatch dashboard configuration
cat > cloudwatch-dashboard.json << 'EOF'
{
  "widgets": [
    {
      "type": "metric",
      "x": 0,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/ElasticBeanstalk", "EnvironmentHealth", "EnvironmentName", "aushadhi-production" ]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Environment Health"
      }
    },
    {
      "type": "metric",
      "x": 12,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/EC2", "CPUUtilization", "InstanceId", "i-012345abcdef" ]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "CPU Utilization"
      }
    },
    {
      "type": "metric",
      "x": 0,
      "y": 6,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/EC2", "NetworkIn", "InstanceId", "i-012345abcdef" ],
          [ "AWS/EC2", "NetworkOut", "InstanceId", "i-012345abcdef" ]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Network Traffic"
      }
    }
  ]
}
EOF

# Get your EC2 instance ID from Elastic Beanstalk
EC2_INSTANCE_ID=$(aws elasticbeanstalk describe-environment-resources --environment-name aushadhi-production --query "EnvironmentResources.Instances[0].Id" --output text)

# Update instance ID in dashboard configuration
sed -i "s/i-012345abcdef/$EC2_INSTANCE_ID/g" cloudwatch-dashboard.json

# Create CloudWatch dashboard
aws cloudwatch put-dashboard --dashboard-name AushadhiAI --dashboard-body file://cloudwatch-dashboard.json
```

### 5.2 Set Up CloudWatch Alarms

Create alarms for critical metrics:

```bash
# Create an alarm for high CPU utilization
aws cloudwatch put-metric-alarm \
  --alarm-name "AushadhiAI-HighCPU" \
  --alarm-description "Alarm when CPU exceeds 80% for 5 minutes" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions "Name=InstanceId,Value=$EC2_INSTANCE_ID" \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:$AWS_ACCOUNT_ID:AushadhiAlerts

# Create an alarm for health status changes
aws cloudwatch put-metric-alarm \
  --alarm-name "AushadhiAI-HealthStatus" \
  --alarm-description "Alarm when environment becomes degraded or severe" \
  --metric-name EnvironmentHealth \
  --namespace AWS/ElasticBeanstalk \
  --statistic Maximum \
  --period 300 \
  --threshold 20 \
  --comparison-operator GreaterThanThreshold \
  --dimensions "Name=EnvironmentName,Value=aushadhi-production" \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:$AWS_ACCOUNT_ID:AushadhiAlerts
```

### 5.3 Set Up Custom Domain (Optional)

If you have a custom domain, you can set it up with Route 53:

```bash
# Create hosted zone for your domain (if not already created)
aws route53 create-hosted-zone --name yourdomain.com --caller-reference $(date +%s)

# Save the hosted zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name yourdomain.com --query "HostedZones[0].Id" --output text | sed 's|/hostedzone/||')

# Create record configuration
cat > route53-records.json << EOF
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.yourdomain.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "aushadhi-production.us-east-1.elasticbeanstalk.com"
          }
        ]
      }
    }
  ]
}
EOF

# Create the DNS record
aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID --change-batch file://route53-records.json
```

## 6. Testing and Verification

### 6.1 Verifying Backend Deployment

```bash
# Check if the backend API is accessible
curl http://aushadhi-production.us-east-1.elasticbeanstalk.com/api/health

# Expected response:
# {"status":"healthy","services":{"ocr":"active","medication_db":"active","api":"active"}}
```

### 6.2 Verifying Frontend Deployment

1. Open your browser and navigate to `https://harryhome1.github.io/INTRO-AushadhiAI/`
2. Check browser console for any errors related to API connections
3. Try uploading a prescription image to test the complete flow

### 6.3 End-to-End Testing

1. **Prescription Upload Test**:
   - Upload a valid prescription image
   - Verify that the prescription is analyzed and medications are detected
   - Check that medication details are properly displayed

2. **Error Handling Test**:
   - Upload an invalid file
   - Verify that appropriate error messages are displayed

3. **Responsive Design Test**:
   - Test the application on various screen sizes
   - Ensure the interface is responsive and usable on mobile devices

## 7. Troubleshooting

### 7.1 Common Deployment Issues

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Elastic Beanstalk deployment fails | Insufficient permissions | Verify IAM user has all required permissions |
| Container fails to start | Environment variables missing | Check Elastic Beanstalk environment configuration |
| CORS errors in browser | Incorrect ALLOWED_ORIGINS | Update ALLOWED_ORIGINS in Elastic Beanstalk configuration |
| GitHub Pages deployment fails | Issues with GitHub Actions | Check workflow logs for specific errors |
| API returning 500 errors | Application error | Check CloudWatch logs for detailed error messages |

### 7.2 Checking Logs

```bash
# Get recent logs from Elastic Beanstalk
aws elasticbeanstalk request-environment-info --environment-name aushadhi-production --info-type tail

# After a few seconds, retrieve the logs
aws elasticbeanstalk retrieve-environment-info --environment-name aushadhi-production --info-type tail
```

### 7.3 Debugging Container Issues

```bash
# SSH into the EC2 instance (if needed)
# First, get the key pair name
KEY_PAIR=$(aws ec2 describe-instances --instance-ids $EC2_INSTANCE_ID --query "Reservations[0].Instances[0].KeyName" --output text)

# Download the key pair (if you have access to it)
# Connect to the instance
ssh -i your-key.pem ec2-user@$EC2_INSTANCE_ID

# Check Docker container status
docker ps -a

# View container logs
docker logs $(docker ps -q --filter "name=aushadhi")
```

## 8. Enhancements and Next Steps

### 8.1 Security Enhancements

1. **HTTPS Configuration**:
   - Set up AWS Certificate Manager for your domain
   - Configure HTTPS for Elastic Beanstalk
   - Update frontend API URLs to use HTTPS

2. **AWS WAF Integration**:
   - Set up AWS WAF to protect against common web exploits
   - Configure rate limiting to prevent abuse

3. **Secret Management**:
   - Use AWS Secrets Manager for sensitive credentials
   - Rotate credentials periodically

### 8.2 Performance Optimizations

1. **Content Delivery Network**:
   - Set up AWS CloudFront to accelerate content delivery
   - Configure caching policies for static assets

2. **Auto Scaling**:
   - Configure Auto Scaling for your Elastic Beanstalk environment
   - Set up scaling policies based on traffic patterns

3. **Database Integration**:
   - Add Amazon RDS for persistent data storage
   - Implement caching with Amazon ElastiCache

### 8.3 Monitoring and Alerting

1. **Enhanced Monitoring**:
   - Set up AWS X-Ray for distributed tracing
   - Implement custom CloudWatch metrics for application-specific monitoring

2. **Alerting Improvements**:
   - Configure Amazon SNS topics for different alert levels
   - Set up email or SMS notifications for critical alerts

3. **Log Analysis**:
   - Use CloudWatch Logs Insights for advanced log analysis
   - Implement centralized logging with Amazon OpenSearch Service

## File References

Here's a summary of all configuration files used in this deployment:

| File | Purpose | Location |
|------|---------|----------|
| `Dockerfile` | Container configuration | Repository root |
| `.dockerignore` | Files to exclude from container | Repository root |
| `requirements.txt` | Python dependencies | Repository root |
| `eb-options.json` | Elastic Beanstalk configuration | During AWS setup |
| `github-actions-policy.json` | IAM policy for GitHub Actions | During AWS setup |
| `cloudwatch-dashboard.json` | CloudWatch dashboard | Post-deployment |
| `route53-records.json` | DNS records configuration | Optional, for custom domain |
| `.github/workflows/deploy-frontend.yml` | GitHub Actions for frontend | Repository |
| `.github/workflows/deploy-backend-aws.yml` | GitHub Actions for backend | Repository |

---

This deployment plan was prepared for the AushadhiAI project hosted at https://github.com/harryhome1/INTRO-AushadhiAI. 