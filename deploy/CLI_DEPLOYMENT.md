# Render CLI Deployment Guide for PDF Shelf

## Overview

This guide explains how to deploy the PDF Shelf application using Render CLI and Infrastructure as Code (IaC) with automated GitHub Actions workflows.

## Prerequisites

### Required Accounts & Services
- **Render Account**: [Sign up at render.com](https://render.com)
- **GitHub Repository**: Connected to Render
- **AWS Account**: For S3 storage (replaces MinIO in production)
- **MTN MoMo Developer Account**: For payment processing

### Required Tools
- **Render CLI**: Installed locally for manual deployments
- **Git**: For version control and deployments
- **curl/jq**: For API interactions (optional)

## Setup Instructions

### 1. Install Render CLI

#### macOS (using Homebrew)
```bash
brew update
brew install render
```

#### Linux/Manual Installation
```bash
# Download latest version
RENDER_CLI_VERSION="1.2.4"
curl -L https://github.com/render-oss/cli/releases/download/v${RENDER_CLI_VERSION}/cli_${RENDER_CLI_VERSION}_linux_amd64.zip -o render.zip
unzip render.zip
sudo mv cli_v${RENDER_CLI_VERSION} /usr/local/bin/render
rm render.zip

# Verify installation
render --version
```

### 2. Authenticate with Render

#### Interactive Login (for local development)
```bash
render login
```
This opens your browser to generate a CLI token.

#### API Key (for CI/CD)
1. Go to [Render Account Settings](https://dashboard.render.com/account)
2. Generate an API key
3. Set environment variable:
```bash
export RENDER_API_KEY=rnd_YOUR_API_KEY_HERE
```

### 3. Prepare AWS S3

#### Create S3 Bucket
```bash
# Using AWS CLI
aws s3 mb s3://pdf-shelf-production-YOUR-UNIQUE-ID --region us-east-1

# Set bucket policy for public access (adjust as needed)
aws s3api put-bucket-cors --bucket pdf-shelf-production-YOUR-UNIQUE-ID --cors-configuration file://s3-cors.json
```

#### S3 CORS Configuration (s3-cors.json)
```json
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
            "AllowedOrigins": ["https://your-frontend-domain.onrender.com"],
            "ExposeHeaders": []
        }
    ]
}
```

#### Create IAM User
1. Create IAM user with S3 access
2. Attach policy: `AmazonS3FullAccess` (or create custom policy)
3. Generate access keys

### 4. Configure Environment Variables

#### GitHub Secrets (for CI/CD)
Add these secrets to your GitHub repository:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `RENDER_API_KEY` | Render API key for authentication | `rnd_abc123...` |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_S3_BUCKET` | S3 bucket name | `pdf-shelf-production-123` |

#### Local Environment (for manual deployment)
```bash
# Create local .env file for deployment
cat > deploy/.env.local << EOF
RENDER_API_KEY=rnd_your_api_key_here
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_S3_BUCKET=pdf-shelf-production-your-unique-id
EOF
```

## Deployment Methods

### Method 1: Automated GitHub Actions (Recommended)

#### Trigger Deployment
Deployments automatically trigger on pushes to `main` branch:
```bash
git push origin main
```

#### Manual Trigger
Use GitHub Actions workflow dispatch:
1. Go to **Actions** tab in your repository
2. Select **Deploy to Render** workflow
3. Click **Run workflow**
4. Choose environment and run

#### Monitor Deployment
- Check GitHub Actions logs for deployment progress
- View deployment status in Render Dashboard
- Check service health at deployed URLs

### Method 2: Manual CLI Deployment

#### Using Deployment Script
```bash
# Make script executable
chmod +x scripts/deploy.sh

# Set required environment variables
export AWS_ACCESS_KEY_ID="your_aws_access_key_id"
export AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key"
export AWS_S3_BUCKET="pdf-shelf-production-your-unique-id"

# Run deployment
./scripts/deploy.sh production
```

#### Direct CLI Commands
```bash
# Authenticate
render login

# Deploy using blueprint
render blueprint launch --output json --confirm

# Monitor services
render services --output text --confirm

# Check deployment status
render deploys list pdf-shelf-api-service-id
```

## Infrastructure as Code (render.yaml)

The `render.yaml` file defines your entire infrastructure:

### Services Deployed
1. **pdf-shelf-api** (Web Service)
   - Rust backend API
   - Docker-based deployment
   - Health check endpoint: `/health`
   
2. **pdf-shelf-frontend** (Static Site)
   - Frontend application
   - Automatic builds from source
   - CDN distribution

3. **pdf-shelf-db** (PostgreSQL Database)
   - Managed PostgreSQL instance
   - Automatic backups
   - High availability

### Key Features
- **Auto-deployment**: Triggered on git pushes
- **Environment variables**: Centrally managed
- **Health checks**: Automatic service monitoring
- **Scaling**: Configurable instance types
- **Networking**: Secure inter-service communication

## Environment Variables Reference

### Backend API Environment Variables

| Variable | Description | Source | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Auto-generated from database | ✅ |
| `JWT_SECRET` | JWT signing secret | Auto-generated | ✅ |
| `AWS_ACCESS_KEY_ID` | AWS S3 access key | GitHub secret | ✅ |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 secret key | GitHub secret | ✅ |
| `AWS_S3_BUCKET` | S3 bucket name | GitHub secret | ✅ |
| `MTN_URL` | MTN MoMo API endpoint | Static value | ✅ |
| `MTN_COLLECTION_PRIMARY_KEY` | MTN primary key | Static value | ✅ |
| `MTN_COLLECTION_SECONDARY_KEY` | MTN secondary key | Static value | ✅ |
| `MTN_CALLBACK_URL` | Payment callback URL | Auto-generated | ✅ |
| `RUST_LOG` | Logging level | Static value | ❌ |

### Frontend Environment Variables

| Variable | Description | Source | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | Auto-generated from backend | ✅ |
| `REACT_APP_API_URL` | Backend API URL (React) | Auto-generated from backend | ❌ |

## Monitoring and Maintenance

### Service Health Checks
```bash
# Check all services
render services --output text --confirm

# Check specific service health
curl https://pdf-shelf-api.onrender.com/health

# View service logs
render logs pdf-shelf-api-service-id --tail
```

### Deployment Status
```bash
# List recent deployments
render deploys list pdf-shelf-api-service-id

# Get deployment details
render deploys get deployment-id

# Rollback to previous deployment
render deploys rollback pdf-shelf-api-service-id previous-deployment-id
```

### Scaling Services
```bash
# Scale backend service
render services scale pdf-shelf-api-service-id --instance-type starter

# Update environment variables
render services env-vars set pdf-shelf-api-service-id KEY=value
```

## Troubleshooting

### Common Issues

#### 1. Authentication Errors
```bash
# Re-authenticate
render login

# Check current authentication
render services --output json --confirm
```

#### 2. Blueprint Launch Failures
- Verify all required environment variables are set
- Check service names don't conflict with existing services
- Ensure region availability

#### 3. Build Failures
```bash
# Check build logs
render deploys logs deployment-id

# Common solutions:
# - Update Dockerfile paths
# - Verify dependency versions
# - Check environment variable values
```

#### 4. Database Connection Issues
```bash
# Check database status
render services --output json --confirm | jq '.[] | select(.type=="postgres")'

# Verify DATABASE_URL format
# Should be: postgres://user:password@host:port/database
```

#### 5. S3 Integration Problems
- Verify AWS credentials are correct
- Check S3 bucket permissions
- Ensure CORS policy is configured
- Test with AWS CLI: `aws s3 ls s3://your-bucket-name`

### Debugging Commands

```bash
# View all services and their status
render services --output table --confirm

# Get detailed service information
render services get service-id --output json

# Monitor real-time logs
render logs service-id --tail --follow

# Open SSH session (paid plans only)
render ssh service-id

# Open database connection
render psql database-id
```

## Best Practices

### Security
1. **Never commit API keys** to version control
2. **Use GitHub secrets** for sensitive environment variables
3. **Rotate API keys** regularly
4. **Configure proper S3 bucket policies**
5. **Use HTTPS** for all communications

### Performance
1. **Use appropriate instance types** for your workload
2. **Enable auto-scaling** for high-traffic applications
3. **Monitor resource usage** and optimize accordingly
4. **Use CDN** for static assets (automatic with Render)

### Reliability
1. **Set up health checks** for all services
2. **Configure alerts** for service failures
3. **Implement proper logging** throughout your application
4. **Test deployments** in staging environment first
5. **Have rollback plans** ready

### Cost Optimization
1. **Use free tier** for development/testing
2. **Scale down** non-production environments
3. **Monitor usage** and adjust plans accordingly
4. **Use spot instances** for non-critical workloads (when available)

## Production Checklist

Before going to production:

- [ ] All environment variables configured correctly
- [ ] S3 bucket and IAM permissions set up
- [ ] Custom domains configured (optional)
- [ ] SSL certificates enabled (automatic)
- [ ] Health checks passing
- [ ] Monitoring and alerts configured
- [ ] Backup strategy implemented
- [ ] Switch MTN MoMo from sandbox to production
- [ ] Load testing completed
- [ ] Security review completed

## Support and Resources

### Documentation
- [Render CLI Documentation](https://render.com/docs/cli)
- [Render Blueprint Reference](https://render.com/docs/blueprint-spec)
- [Render API Documentation](https://api-docs.render.com/)

### Community
- [Render Community Forum](https://community.render.com/)
- [GitHub Issues](https://github.com/render-oss/cli/issues)

### Emergency Contacts
- **Render Support**: Available through dashboard for paid plans
- **AWS Support**: Based on your support plan
- **MTN MoMo Support**: Through developer portal