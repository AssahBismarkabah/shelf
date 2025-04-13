#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:8080/api"
MINIO_UI_URL="http://localhost:9001"

# Function to print section headers
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Function to print info messages
print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Function to print results
print_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1${NC}"
    fi
}

# Function to show MinIO instructions
show_minio_instructions() {
    print_info "To view changes in MinIO UI:"
    print_info "1. Open MinIO Console at: $MINIO_UI_URL"
    print_info "2. Login with your MinIO credentials"
    print_info "3. Navigate to the 'pdfshelf' bucket"
    print_info "4. Look for a folder with the user ID (likely '1')"
    print_info "5. You should see your uploaded files here"
}

# Function to register a new user
register() {
    print_header "User Registration"
    print_info "Registering new user: test@example123.com"
    
    REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example123.com","password":"test123","full_name":"Test User"}')
    
    echo "Register response: $REGISTER_RESPONSE"
    print_result "User registration"
}

# Function to login and get token
login() {
    print_header "User Login"
    print_info "Logging in as: test@example123.com"
    
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example123.com","password":"test123"}')
    
    echo "Login response: $LOGIN_RESPONSE"
    
    # Extract token
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
    if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
        echo -e "${RED}Failed to extract token from response${NC}"
        return 1
    fi
    
    echo $TOKEN > .token
    print_result "User login"
}

# Function to upload a document
upload() {
    print_header "Document Upload"
    
    if [ ! -f .token ]; then
        echo -e "${RED}Token file not found. Please run login first.${NC}"
        return 1
    fi
    
    TOKEN=$(cat .token)
    print_info "Using token: ${TOKEN:0:20}..."
    print_info "Uploading test document"
    
    # Create a test file if it doesn't exist
    if [ ! -f test.pdf ]; then
        print_info "Creating test PDF file"
        echo "This is a test PDF file" > test1.pdf
    fi
    
    print_info "Sending request to $BASE_URL/documents"
    
    # Use -v for verbose output and save both stdout and stderr
    UPLOAD_RESPONSE=$(curl -v -X POST "$BASE_URL/documents" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: multipart/form-data" \
        -F "file=@test.pdf" 2>&1)
    
    echo "Upload response: $UPLOAD_RESPONSE"
    
    # Check if the response contains an error
    if echo "$UPLOAD_RESPONSE" | grep -q "error"; then
        echo -e "${RED}Upload failed with error${NC}"
        return 1
    fi
    
    # Try to extract document ID from response
    DOC_ID=$(echo "$UPLOAD_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$DOC_ID" ]; then
        echo "$DOC_ID" > .doc_id
        print_info "Document ID saved: $DOC_ID"
    fi
    
    print_result "Document upload"
    show_minio_instructions
}

# Function to list documents
list() {
    print_header "Document Listing"
    
    if [ ! -f .token ]; then
        echo -e "${RED}Token file not found. Please run login first.${NC}"
        return 1
    fi
    
    TOKEN=$(cat .token)
    print_info "Listing documents"
    
    LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/documents" \
        -H "Authorization: Bearer $TOKEN")
    
    echo "Documents:"
    echo "$LIST_RESPONSE" | jq '.'
    print_result "Document listing"
}

# Function to download a document
download() {
    print_header "Document Download"
    
    if [ ! -f .token ]; then
        echo -e "${RED}Token file not found. Please run login first.${NC}"
        return 1
    fi
    
    TOKEN=$(cat .token)
    print_info "Downloading document"
    
    # Get the first document ID from the list
    DOC_ID=$(curl -s -X GET "$BASE_URL/documents" \
        -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')
    
    if [ -z "$DOC_ID" ] || [ "$DOC_ID" = "null" ]; then
        echo -e "${RED}No documents found to download${NC}"
        return 1
    fi
    
    curl -s -X GET "$BASE_URL/documents/$DOC_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -o downloaded.pdf
    
    if [ -f downloaded.pdf ]; then
        echo "Document downloaded to: downloaded.pdf"
        print_result "Document download"
    else
        echo -e "${RED}Failed to download document${NC}"
        return 1
    fi
}

# Function to delete a document
delete() {
    print_header "Document Deletion"
    
    if [ ! -f .token ]; then
        echo -e "${RED}Token file not found. Please run login first.${NC}"
        return 1
    fi
    
    TOKEN=$(cat .token)
    print_info "Deleting document"
    
    # Get the first document ID from the list
    DOC_ID=$(curl -s -X GET "$BASE_URL/documents" \
        -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')
    
    if [ -z "$DOC_ID" ] || [ "$DOC_ID" = "null" ]; then
        echo -e "${RED}No documents found to delete${NC}"
        return 1
    fi
    
    DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/documents/$DOC_ID" \
        -H "Authorization: Bearer $TOKEN")
    
    echo "Delete response: $DELETE_RESPONSE"
    print_result "Document deletion"
    
    # Show MinIO instructions after deletion
    show_minio_instructions
}

# Main script
case "$1" in
    "register")
        register
        ;;
    "login")
        login
        ;;
    "upload")
        upload
        ;;
    "list")
        list
        ;;
    "download")
        download
        ;;
    "delete")
        delete
        ;;
    *)
        echo "Usage: $0 {register|login|upload|list|download|delete}"
        exit 1
        ;;
esac 