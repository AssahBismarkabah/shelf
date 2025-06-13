#!/bin/bash

# PDF Shelf Deployment Script for Render
# Usage: ./scripts/deploy.sh [environment]

set -e

# Configuration
RENDER_CLI_VERSION="1.2.4"
ENVIRONMENT=${1:-"production"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Render CLI is installed
check_render_cli() {
    if ! command -v render &> /dev/null; then
        print_status "Installing Render CLI..."
        curl -L https://github.com/render-oss/cli/releases/download/v${RENDER_CLI_VERSION}/cli_${RENDER_CLI_VERSION}_linux_amd64.zip -o render.zip
        unzip render.zip
        sudo mv cli_v${RENDER_CLI_VERSION} /usr/local/bin/render
        rm render.zip
        print_success "Render CLI installed successfully"
    else
        print_status "Render CLI is already installed"
    fi
}

# Check authentication
check_auth() {
    print_status "Checking authentication..."
    if ! render services --output json --confirm &> /dev/null; then
        print_error "Not authenticated with Render CLI"
        print_status "Please run: render login"
        exit 1
    fi
    print_success "Authentication verified"
}

# Validate environment variables
validate_env() {
    print_status "Validating environment variables..."
    
    local required_vars=(
        "AWS_ACCESS_KEY_ID"
        "AWS_SECRET_ACCESS_KEY"
        "AWS_S3_BUCKET"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        print_status "Please set these variables and try again"
        exit 1
    fi
    
    print_success "All required environment variables are set"
}

# Deploy using blueprint
deploy_services() {
    print_status "Deploying services using blueprint..."
    
    # Launch blueprint
    render blueprint launch --output json --confirm
    
    if [ $? -eq 0 ]; then
        print_success "Blueprint deployment initiated"
    else
        print_error "Blueprint deployment failed"
        exit 1
    fi
}

# Wait for deployments to complete
wait_for_deployments() {
    print_status "Waiting for deployments to complete..."
    
    # Get service IDs
    local backend_id=$(render services --output json --confirm | jq -r '.[] | select(.name=="pdf-shelf-api") | .id' | head -1)
    local frontend_id=$(render services --output json --confirm | jq -r '.[] | select(.name=="pdf-shelf-frontend") | .id' | head -1)
    
    if [ ! -z "$backend_id" ]; then
        print_status "Waiting for backend deployment (ID: $backend_id)..."
        render deploys create $backend_id --wait --output json --confirm
        print_success "Backend deployment completed"
    fi
    
    if [ ! -z "$frontend_id" ]; then
        print_status "Waiting for frontend deployment (ID: $frontend_id)..."
        render deploys create $frontend_id --wait --output json --confirm
        print_success "Frontend deployment completed"
    fi
}

# Update environment variables with actual URLs
update_env_vars() {
    print_status "Updating environment variables..."
    
    local backend_url=$(render services --output json --confirm | jq -r '.[] | select(.name=="pdf-shelf-api") | .serviceDetails.url' | head -1)
    local frontend_url=$(render services --output json --confirm | jq -r '.[] | select(.name=="pdf-shelf-frontend") | .serviceDetails.url' | head -1)
    
    if [ ! -z "$backend_url" ]; then
        print_success "Backend URL: $backend_url"
        print_warning "Please manually update MTN_CALLBACK_URL to: ${backend_url}/api/payments/callback"
    fi
    
    if [ ! -z "$frontend_url" ]; then
        print_success "Frontend URL: $frontend_url"
    fi
}

# Health check
health_check() {
    print_status "Performing health checks..."
    
    local backend_url=$(render services --output json --confirm | jq -r '.[] | select(.name=="pdf-shelf-api") | .serviceDetails.url' | head -1)
    
    if [ ! -z "$backend_url" ]; then
        print_status "Checking backend health at: ${backend_url}/health"
        if curl -f "${backend_url}/health" &> /dev/null; then
            print_success "Backend health check passed"
        else
            print_warning "Backend health check failed - service may still be starting"
        fi
    fi
}

# Main execution
main() {
    print_status "Starting PDF Shelf deployment to Render ($ENVIRONMENT environment)"
    
    # Pre-deployment checks
    check_render_cli
    check_auth
    validate_env
    
    # Deployment
    deploy_services
    wait_for_deployments
    update_env_vars
    
    # Post-deployment
    health_check
    
    print_success "Deployment completed successfully!"
    print_status "Services:"
    render services --output text --confirm | grep -E "(pdf-shelf-api|pdf-shelf-frontend|pdf-shelf-db)"
    
    echo ""
    print_status "Next steps:"
    echo "1. Update MTN_CALLBACK_URL environment variable with the actual backend URL"
    echo "2. Configure your custom domain (optional)"
    echo "3. Set up monitoring and alerts"
    echo "4. Test all functionality"
}

# Run main function
main "$@"