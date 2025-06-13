# Render.yaml Explained: PDF Shelf Deployment Architecture

## Overview

The `render.yaml` file is Render's **Infrastructure as Code** (IaC) configuration that defines your entire application stack. It replaces manual UI configuration and enables automated, reproducible deployments.

## Architecture Overview

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Frontend          │    │   Backend API       │    │   PostgreSQL        │
│  (Static Site)      │───▶│  (Web Service)      │───▶│   (Database)        │
│  - React/Vue/etc    │    │  - Rust/Docker      │    │  - Managed DB       │
│  - CDN Hosted       │    │  - Health Checks    │    │  - Auto Backups     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │     AWS S3          │
                           │  (File Storage)     │
                           │  - PDF Documents    │
                           │  - User Uploads     │
                           └─────────────────────┘
```

## Services Breakdown

### 1. Backend API Service (`pdf-shelf-api`)

```yaml
- type: web
  name: pdf-shelf-api
  runtime: docker
  dockerfilePath: ./backend/Dockerfile
  dockerContext: ./backend
```

**Purpose**: Main application server handling API requests, file processing, and payments.

**Key Features**:
- **Runtime**: Docker (using your custom Rust container)
- **Health Check**: `/health` endpoint for monitoring
- **Auto Deploy**: Triggered on git pushes to main branch
- **Plan**: Starter ($7/month) - provides consistent uptime

**Why Docker?**: 
- Rust isn't a native Render runtime
- Docker ensures consistent environment
- Includes all dependencies and compilation

### 2. Frontend Service (`pdf-shelf-frontend`)

```yaml
- type: web
  name: pdf-shelf-frontend
  runtime: static
  buildCommand: npm ci && npm run build
  staticPublishPath: ./dist
```

**Purpose**: User interface served as static files via CDN.

**Key Features**:
- **Runtime**: Static site (HTML/CSS/JS files)
- **Build**: Automatically runs `npm ci && npm run build`
- **CDN**: Global distribution for fast loading
- **Plan**: Free - static sites don't need compute resources

**Why Static?**: 
- Frontend frameworks compile to static files
- Much faster than server-side rendering
- Free hosting with global CDN

### 3. Database Service (`pdf-shelf-db`)

```yaml
databases:
  - name: pdf-shelf-db
    plan: free
    databaseName: pdfshelf
    user: pdfshelf
```

**Purpose**: PostgreSQL database for application data.

**Key Features**:
- **Managed Service**: Render handles maintenance, backups, updates
- **High Availability**: Built-in redundancy
- **Connection String**: Auto-generated and injected into API service
- **Plan**: Free tier (limited connections/storage)

## Environment Variables Deep Dive

### Database Connection
```yaml
- key: DATABASE_URL
  fromDatabase:
    name: pdf-shelf-db
    property: connectionString
```
**Magic**: Render automatically generates the connection string and injects it into your API service.

### JWT Security
```yaml
- key: JWT_SECRET
  generateValue: true
```
**Magic**: Render generates a cryptographically secure random value automatically.

### AWS S3 Configuration (The Tricky Part)

```yaml
# Direct AWS variables
- key: AWS_ACCESS_KEY_ID
  # Must be set manually in Render Dashboard
- key: AWS_SECRET_ACCESS_KEY  
  # Must be set manually in Render Dashboard
- key: AWS_S3_BUCKET
  # Must be set manually in Render Dashboard

# MinIO-compatible variables (for your Rust code)
- key: MINIO_ENDPOINT
  value: s3.amazonaws.com
- key: MINIO_ACCESS_KEY
  # Should match AWS_ACCESS_KEY_ID
- key: MINIO_SECRET_KEY
  # Should match AWS_SECRET_ACCESS_KEY  
- key: MINIO_BUCKET
  # Should match AWS_S3_BUCKET
```

**Why Both Sets?**: Your Rust code uses MinIO SDK with `MINIO_*` variable names, but you're actually connecting to AWS S3.

### Service-to-Service Communication
```yaml
- key: VITE_API_URL
  fromService:
    type: web
    name: pdf-shelf-api
    property: url
```
**Magic**: Frontend automatically gets the backend's URL, even if it changes.

## Secrets Handling Issues & Solutions

### ❌ Current Problem
```yaml
- key: AWS_ACCESS_KEY_ID
  # No value specified - this creates an empty environment variable
```

### ✅ Solution: Manual Configuration Required

**After deploying via render.yaml, you MUST manually add these secrets:**

1. Go to Render Dashboard → Your API Service → Environment
2. Add these variables manually:
   - `AWS_ACCESS_KEY_ID` = your AWS access key
   - `AWS_SECRET_ACCESS_KEY` = your AWS secret key  
   - `AWS_S3_BUCKET` = your S3 bucket name
   - `MINIO_ACCESS_KEY` = same as AWS_ACCESS_KEY_ID
   - `MINIO_SECRET_KEY` = same as AWS_SECRET_ACCESS_KEY
   - `MINIO_BUCKET` = same as AWS_S3_BUCKET

### Why Can't Secrets Be in render.yaml?

1. **Security**: render.yaml is committed to Git - secrets would be exposed
2. **Render Limitation**: No built-in secret management in blueprints
3. **Best Practice**: Secrets should never be in version control

## MinIO vs S3 Explanation

### What You're Actually Using: AWS S3
- **Storage**: Amazon S3 buckets
- **API**: AWS S3 REST API
- **Benefits**: Highly reliable, scalable, integrated with AWS ecosystem

### Why MinIO Variable Names?
- **Compatibility**: Your Rust code uses MinIO SDK
- **MinIO SDK**: Can connect to any S3-compatible storage (including AWS S3)
- **No Code Changes**: Keep existing variable names, just point to S3

### Connection Flow:
```
Rust App → MinIO SDK → S3-Compatible API → AWS S3
```

Your app thinks it's talking to MinIO, but it's actually talking to AWS S3.

## Deployment Process

### 1. Initial Deployment
```bash
render blueprint launch
```
- Creates all services defined in render.yaml
- Sets up networking between services
- Configures auto-deployment

### 2. Manual Secret Configuration
- Go to Render Dashboard
- Add AWS credentials to API service
- Services restart automatically with new variables

### 3. Ongoing Deployments
- Push to main branch → automatic deployment
- No manual intervention needed
- Health checks ensure successful deployment

## Auto-Generated URLs

### Service URLs (examples):
- **Frontend**: `https://pdf-shelf-frontend.onrender.com`
- **Backend**: `https://pdf-shelf-api.onrender.com`
- **Database**: Internal connection only

### MTN Callback URL:
```yaml
- key: MTN_CALLBACK_URL
  fromService:
    type: web
    name: pdf-shelf-api
    property: url
```
Result: `https://pdf-shelf-api.onrender.com` + `/api/payments/callback`

## Benefits of render.yaml Approach

### 1. **Infrastructure as Code**
- Version controlled infrastructure
- Reproducible deployments
- Easy rollbacks

### 2. **Service Discovery**
- Services automatically find each other
- No hardcoded URLs
- Resilient to changes

### 3. **Simplified Management**
- One file defines entire stack
- No manual service creation
- Consistent environments

### 4. **Cost Optimization**
- Right-sized instances for each service
- Free tier for frontend/database
- Pay only for what you need

## Common Issues & Solutions

### 1. **Missing Secrets**
**Problem**: Services fail to start due to missing AWS credentials
**Solution**: Manually add secrets in Render Dashboard after initial deployment

### 2. **Build Failures**
**Problem**: Docker build fails
**Solution**: Check Dockerfile paths and build context in render.yaml

### 3. **Service Communication**
**Problem**: Frontend can't reach backend
**Solution**: Verify `fromService` references in environment variables

### 4. **Database Connection**
**Problem**: Backend can't connect to database
**Solution**: Ensure database name matches in both database and service configs

## Production Considerations

### Security Checklist
- [ ] All secrets configured manually (not in render.yaml)
- [ ] Database has strong password (auto-generated)
- [ ] S3 bucket has proper permissions
- [ ] HTTPS enabled (automatic with Render)

### Performance Checklist
- [ ] Frontend uses CDN (automatic with static sites)
- [ ] Database sized appropriately
- [ ] API service has sufficient resources
- [ ] Health checks configured

### Monitoring Checklist
- [ ] Health check endpoints working
- [ ] Log aggregation configured
- [ ] Error tracking enabled
- [ ] Uptime monitoring active

## Next Steps After Deployment

1. **Verify Services**: Check all services are running in Render Dashboard
2. **Add Secrets**: Configure AWS credentials manually
3. **Test Functionality**: Verify file upload, payments, etc.
4. **Custom Domains**: Configure your own domain names (optional)
5. **Monitoring**: Set up alerts and monitoring
6. **Backup Strategy**: Ensure database backups are enabled

## Comparison: render.yaml vs Manual Setup

| Aspect | render.yaml | Manual UI Setup |
|--------|-------------|-----------------|
| **Speed** | Deploy entire stack in minutes | Hours of clicking |
| **Reproducibility** | 100% consistent | Human error prone |
| **Version Control** | Yes | No |
| **Team Collaboration** | Easy to share/review | Hard to document |
| **Rollbacks** | Git-based | Manual recreation |
| **Scaling** | Modify file, redeploy | Click through UI again |

The render.yaml approach is clearly superior for any serious application deployment.