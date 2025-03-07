# AushadhiAI Deployment Checklist

This checklist outlines all steps needed to successfully deploy the AushadhiAI application to AWS and GitHub Pages.

## Pre-Deployment Setup

### AWS Account Configuration

- [ ] Create IAM user for GitHub Actions
  ```bash
  aws iam create-user --user-name github-actions-aushadhi
  aws iam create-policy --policy-name AushadhiGitHubActionsPolicy --policy-document file://github-actions-policy.json
  aws iam attach-user-policy --user-name github-actions-aushadhi --policy-arn arn:aws:iam::ACCOUNT_ID:policy/AushadhiGitHubActionsPolicy
  aws iam create-access-key --user-name github-actions-aushadhi
  # Save the access key and secret key for later use in GitHub Secrets
  ```

- [ ] Create S3 bucket for Elastic Beanstalk deployments
  ```bash
  aws s3 mb s3://aushadhi-eb-deployments-ACCOUNT_ID --region us-east-1
  ```

- [ ] Create ECR repository
  ```bash
  aws ecr create-repository --repository-name aushadhi-backend --image-scanning-configuration scanOnPush=true
  ```

- [ ] Create Elastic Beanstalk application and environment
  ```bash
  aws elasticbeanstalk create-application --application-name aushadhi-backend --description "AushadhiAI Backend API"
  # Update eb-options.json with actual values before running the next command
  aws elasticbeanstalk create-environment --application-name aushadhi-backend --environment-name aushadhi-production --solution-stack-name "64bit Amazon Linux 2 v3.5.1 running Docker" --option-settings file://eb-options.json
  ```

### GitHub Repository Configuration

- [ ] Set up GitHub Secrets (Settings → Secrets and variables → Actions)
  - [ ] `AWS_ACCESS_KEY_ID`: IAM user access key
  - [ ] `AWS_SECRET_ACCESS_KEY`: IAM user secret key
  - [ ] `AWS_REGION`: AWS region (e.g., us-east-1)
  - [ ] `AWS_S3_BUCKET`: S3 bucket name (e.g., aushadhi-eb-deployments-ACCOUNT_ID)
  - [ ] `AZURE_VISION_ENDPOINT`: Azure Computer Vision endpoint
  - [ ] `AZURE_VISION_KEY`: Azure Computer Vision API key

- [ ] Enable GitHub Pages (Settings → Pages)
  - [ ] Source: GitHub Actions

## Deployment Process

### Initial Deployment

- [ ] Commit and push all changes
  ```bash
  git add .
  git commit -m "Configure for AWS deployment"
  git push origin main
  ```

- [ ] Trigger Backend Deployment
  - [ ] Go to Actions tab in GitHub repository
  - [ ] Select "Deploy Backend to AWS" workflow
  - [ ] Click "Run workflow" and select the main branch
  - [ ] Wait for the workflow to complete successfully
  - [ ] Note the Elastic Beanstalk URL

- [ ] Update Frontend Configuration (if needed)
  - [ ] Update the deployed backend URL in the GitHub workflow file
  - [ ] Commit and push changes

- [ ] Trigger Frontend Deployment
  - [ ] Go to Actions tab in GitHub repository
  - [ ] Select "Deploy Frontend to GitHub Pages" workflow
  - [ ] Click "Run workflow" and select the main branch
  - [ ] Wait for the workflow to complete successfully

## Post-Deployment Verification

- [ ] Verify Backend Health
  - [ ] Check the health endpoint: `https://[EB_URL]/api/health`
  - [ ] Verify response: `{"status":"healthy","services":{"ocr":"active","medication_db":"active","api":"active"}}`

- [ ] Verify Frontend Deployment
  - [ ] Access the GitHub Pages URL
  - [ ] Check browser console for any errors
  - [ ] Test the application by uploading a prescription image

- [ ] Set Up CloudWatch Monitoring (optional)
  - [ ] Create CloudWatch dashboard
  - [ ] Set up alerts for critical metrics

## Troubleshooting Common Issues

- **Elastic Beanstalk deployment fails**
  - Check IAM user permissions
  - Verify Docker image built correctly
  - Check CloudWatch logs for specific error messages

- **CORS errors in browser**
  - Verify ALLOWED_ORIGINS in environment variables includes GitHub Pages URL
  - Ensure the backend is accessible over HTTPS

- **API returns 500 errors**
  - Check CloudWatch logs for detailed error messages
  - Verify Azure credentials are correctly set

- **Container fails to start**
  - Check if health check endpoint is correctly implemented
  - Verify environment variables are set correctly

## Contact

For deployment issues, please contact the AushadhiAI team. 