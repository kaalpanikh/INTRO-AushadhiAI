# EC2 Setup Guide for AushadhiAI Backend

This guide walks you through setting up an EC2 instance to run the AushadhiAI backend application from an ECR container.

## 1. Launch an EC2 Instance

1. Log in to the [AWS Management Console](https://console.aws.amazon.com/)
2. Navigate to EC2 service
3. Click "Launch instance"
4. Choose an Amazon Machine Image (AMI):
   - Select "Amazon Linux 2023" (recommended)
   - Or select "Ubuntu Server 22.04 LTS"
5. Choose an Instance Type:
   - Recommended: t2.micro (free tier eligible) for testing
   - For production: t2.small or larger
6. Configure Instance:
   - Keep default VPC settings
   - Enable auto-assign public IP
7. Add Storage:
   - 8 GB should be sufficient
8. Add Tags:
   - Key: Name
   - Value: AushadhiAI-Backend
9. Configure Security Group:
   - Create a new security group
   - Add rule: HTTP (port 80)
   - Add rule: Custom TCP (port 8007)
   - Add rule: SSH (port 22)
10. Review and Launch
11. Create or select an existing key pair for SSH access
12. Launch instance

## 2. Connect to Your EC2 Instance

### Using SSH (Linux/macOS):
```bash
chmod 400 your-key-pair.pem
ssh -i "your-key-pair.pem" ec2-user@your-instance-public-dns
```

### Using SSH (Windows with PuTTY):
1. Open PuTTY
2. Enter your instance's public DNS in the Host Name field
3. Configure SSH > Auth > Credentials to use your PPK file
4. Click "Open" to connect

## 3. Configure AWS Credentials

You'll need to configure AWS credentials on your EC2 instance to access ECR:

```bash
aws configure
```

Enter:
- AWS Access Key ID: _your_access_key_
- AWS Secret Access Key: _your_secret_key_
- Default region name: us-east-1
- Default output format: json

## 4. Run the Deployment Script

1. Upload the `ec2-deploy.sh` script to your EC2 instance:
   ```bash
   scp -i "your-key-pair.pem" ec2-deploy.sh ec2-user@your-instance-public-dns:~/
   ```

2. Make the script executable:
   ```bash
   chmod +x ec2-deploy.sh
   ```

3. Run the script:
   ```bash
   ./ec2-deploy.sh
   ```

## 5. Verify Deployment

Check if the container is running:
```bash
docker ps
```

View container logs:
```bash
docker logs aushadhi-backend
```

Test the API:
```bash
curl http://localhost:8007/api/health
```

## 6. Set Up Domain and HTTPS (Optional)

For production deployment:

1. Register a domain or use a subdomain
2. Set up DNS records pointing to your EC2 instance
3. Install and configure Nginx as a reverse proxy:
   ```bash
   sudo apt-get update
   sudo apt-get install -y nginx
   ```

4. Configure Nginx (/etc/nginx/sites-available/default):
   ```
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:8007;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

5. Set up SSL with Certbot:
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 7. Setup Monitoring (Optional)

Install CloudWatch agent for monitoring:
```bash
sudo amazon-linux-extras install -y collectd
sudo yum install -y amazon-cloudwatch-agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

## 8. Setup Auto-restart (Optional)

Create a cron job to ensure the container restarts if the instance reboots:
```bash
(crontab -l 2>/dev/null; echo "@reboot /home/ec2-user/ec2-deploy.sh") | crontab - 