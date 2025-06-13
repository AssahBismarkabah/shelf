# Secrets Setup Guide for PDF Shelf Deployment

## Overview

This guide explains how to securely manage secrets for your PDF Shelf application deployment. Secrets are sensitive credentials that should never be committed to version control.

## Required Secrets

### 1. GitHub Repository Secrets

Add these secrets to your GitHub repository for automated deployment:

**Location**: Repository → Settings → Secrets and variables → Actions

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `RENDER_API_KEY` | Render authentication token | Generate at [Render Account Settings](https://dashboard.render.com/account) |
| `AWS_ACCESS_KEY_ID` | AWS S3 access key | Create IAM user in AWS Console |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 secret key | Generate with IAM user |
| `AWS_S3_BUCKET` | S3 bucket name | Create bucket in AWS S3 |
| `MTN_COLLECTION_PRIMARY_KEY` | MTN MoMo primary API key | Your MTN Developer Portal |
| `MTN_COLLECTION_SECONDARY_KEY` | MTN MoMo secondary API key | Your MTN Developer Portal |

### 2. Render Dashboard Secrets

After deployment, manually add these environment variables in Render Dashboard:

**Location**: Service → Settings → Environment

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key | Same as GitHub secret |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key | Same as GitHub secret |
| `AWS_S3_BUCKET` | Your S3 bucket name | Same as GitHub secret |
| `MINIO_ACCESS_KEY` | Your AWS access key | MinIO compatibility |
| `MINIO_SECRET_KEY` | Your AWS secret key | MinIO compatibility |
| `MINIO_BUCKET` | Your S3 bucket name | MinIO compatibility |
| `MTN_COLLECTION_PRIMARY_KEY` | Your MTN primary key | Same as GitHub secret |
| `MTN_COLLECTION_SECONDARY_KEY` | Your MTN secondary key | Same as GitHub secret |

## Step-by-Step Setup

### Step 1: Generate Render API Key

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click on your profile → Account Settings
3. Scroll to "API Keys" section
4. Click "Generate New Key"
5. Copy the key (starts with `rnd_`)
6. Add to GitHub secrets as `RENDER_API_KEY`

### Step 2: Set Up AWS S3

#### Create S3 Bucket
```bash
# Using AWS CLI
aws s3 mb s3://pdf-shelf-production-YOUR-UNIQUE-ID --region us-east-1

# Set bucket policy for proper access
aws s3api put-bucket-cors --bucket pdf-shelf-production-YOUR-UNIQUE-ID --cors-configuration file://s3-cors.json
```

#### Create IAM User
1. Go to AWS Console → IAM → Users
2. Click "Add user"
3. User name: `pdf-shelf-s3-user`
4. Access type: "Programmatic access"
5. Attach policies: `AmazonS3FullAccess` (or create custom policy)
6. Complete setup and download credentials CSV
7. Save Access Key ID and Secret Access Key

#### S3 CORS Configuration
Create `s3-cors.json`:
```json
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
            "AllowedOrigins": ["*"],
            "ExposeHeaders": []
        }
    ]
}
```

### Step 3: Get MTN MoMo Keys

1. Go to [MTN MoMo Developer Portal](https://momodeveloper.mtn.com/)
2. Log in to your developer account
3. Navigate to your subscribed APIs
4. Find Collections API
5. Copy Primary Key and Secondary Key
6. **Important**: These are the keys currently exposed in your repository

### Step 4: Add GitHub Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret:

```
Name: RENDER_API_KEY
Value: rnd_your_api_key_here

Name: AWS_ACCESS_KEY_ID  
Value: AKIAIOSFODNN7EXAMPLE

Name: AWS_SECRET_ACCESS_KEY
Value: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLE

Name: AWS_S3_BUCKET
Value: pdf-shelf-production-123

Name: MTN_COLLECTION_PRIMARY_KEY
Value: 7d7eee0a31d74925a58223a3fcf93e5b

Name: MTN_COLLECTION_SECONDARY_KEY
Value: 24e9a4dc928948989c1383fdf033d1b4
```

### Step 5: Deploy and Configure Render

1. **Deploy via GitHub Actions**:
   ```bash
   git push origin main
   ```

2. **Wait for deployment to complete**

3. **Add secrets in Render Dashboard**:
   - Go to your API service → Settings → Environment
   - Add all the environment variables listed in section 2 above
   - Use the same values as your GitHub secrets

## Security Best Practices

### Do's ✅
- Store secrets in GitHub repository secrets
- Use environment variables in application code
- Rotate API keys regularly
- Use least privilege principle for AWS IAM
- Monitor secret usage and access logs

### Don'ts ❌
- Never commit secrets to Git
- Never hardcode secrets in source code
- Never share secrets in plain text
- Never use production secrets in development
- Never log secret values

## Environment-Specific Secrets

### Development (Local)
Use `backend/.env` with development values:
```bash
MTN_URL=https://sandbox.momodeveloper.mtn.com
MTN_COLLECTION_PRIMARY_KEY=dev_key_here
MTN_COLLECTION_SECONDARY_KEY=dev_key_here
AWS_ACCESS_KEY_ID=dev_aws_key
AWS_SECRET_ACCESS_KEY=dev_aws_secret
AWS_S3_BUCKET=pdf-shelf-dev
```

### Production (Render)
Use Render Dashboard environment variables with production values:
- Production MTN keys (when ready to go live)
- Production AWS credentials
- Production S3 bucket

## Troubleshooting

### Common Issues

#### 1. GitHub Actions Failing
**Symptoms**: Deployment fails with "secret not found"
**Solution**: Verify all required secrets are added to GitHub repository

#### 2. Render Service Won't Start
**Symptoms**: Service shows "failed" status
**Solution**: Check that all environment variables are set in Render Dashboard

#### 3. S3 Upload Failures
**Symptoms**: File uploads fail with permission errors
**Solution**: 
- Verify AWS credentials in Render Dashboard
- Check S3 bucket permissions
- Ensure CORS is configured

#### 4. MTN Payment Failures
**Symptoms**: Payment requests fail with authentication errors
**Solution**:
- Verify MTN keys are correctly set
- Check MTN callback URL is accessible
- Ensure using correct MTN environment (sandbox vs production)

### Verification Commands

#### Check GitHub Secrets
```bash
# This will be visible in GitHub Actions logs
echo "Secrets status:"
echo "RENDER_API_KEY: ${RENDER_API_KEY:+SET}"
echo "AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID:+SET}"
echo "AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY:+SET}"
```

#### Test AWS Connection
```bash
# Run this locally to test AWS credentials
aws s3 ls s3://your-bucket-name
```

#### Test MTN Connection
```bash
# Test MTN API connectivity
curl -X GET "https://sandbox.momodeveloper.mtn.com/collection/v1_0/account/balance" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Target-Environment: sandbox" \
  -H "Ocp-Apim-Subscription-Key: YOUR_PRIMARY_KEY"
```

## Secret Rotation Schedule

### Recommended Rotation Frequency
- **Render API Key**: Every 6 months
- **AWS Keys**: Every 3 months  
- **MTN Keys**: As required by MTN policy
- **JWT Secret**: Every 6 months (will cause user logouts)

### Rotation Process
1. Generate new secret in respective service
2. Update GitHub repository secret
3. Update Render Dashboard environment variable
4. Test functionality
5. Revoke old secret
6. Monitor for any issues

## Emergency Procedures

### If Secrets Are Compromised

#### Immediate Actions
1. **Revoke compromised secrets** in respective services
2. **Generate new secrets** immediately
3. **Update all configurations** with new secrets
4. **Monitor for unauthorized usage**
5. **Audit access logs** for suspicious activity

#### GitHub Repository Compromise
1. **Change all secrets** immediately
2. **Review Git history** for exposed secrets
3. **Consider repository reset** if secrets were committed
4. **Notify team members** about the incident

#### Recovery Steps
1. **Generate new secrets** in all services
2. **Update GitHub secrets** with new values
3. **Redeploy application** to apply changes
4. **Test all functionality** thoroughly
5. **Document incident** for future reference

## Monitoring and Alerts

### Set Up Monitoring For
- Failed authentication attempts
- Unusual API usage patterns
- Deployment failures due to missing secrets
- S3 access patterns and costs
- MTN payment transaction patterns

### Recommended Tools
- **AWS CloudTrail**: For AWS API monitoring
- **Render Logs**: For application-level monitoring
- **GitHub Actions**: For deployment monitoring
- **Custom Monitoring**: For MTN API usage

## Compliance and Audit

### Documentation Requirements
- Maintain inventory of all secrets and their purposes
- Document access patterns and usage
- Keep rotation logs and schedules
- Record any security incidents

### Regular Audits
- **Monthly**: Review secret usage and access logs
- **Quarterly**: Rotate secrets and review permissions
- **Annually**: Full security audit and policy review

## Support Contacts

### For Secret-Related Issues
- **Render Support**: Available through dashboard for paid plans
- **AWS Support**: Based on your AWS support plan
- **MTN Developer Support**: Through MTN Developer Portal
- **GitHub Support**: For repository and Actions issues

### Emergency Contacts
Keep contact information readily available for:
- Your team's security lead
- AWS account administrator
- MTN MoMo integration contact
- Render account administrator