#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:8080/api"

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

# Function to register a new user
register() {
    print_header "User Registration"
    print_info "Registering new user: test@example.com"
    
    curl -s -X POST "$BASE_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"test123","full_name":"Test User"}'
    
    print_result "User registration"
}

# Function to login and get token
login() {
    print_header "User Login"
    print_info "Logging in as: test@example.com"
    
    LOGIN_RESPONSE=$(curl -v -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"test123"}' 2>&1)
    
    echo "Full response:"
    echo "$LOGIN_RESPONSE"
    
    # Extract token from the response body (last line)
    RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | grep -v "^*" | grep -v "^>" | grep -v "^<" | grep -v "^}" | tail -n 1)
    echo "Response body: $RESPONSE_BODY"
    
    if [ -z "$RESPONSE_BODY" ]; then
        echo -e "${RED}Empty response from server${NC}"
        return 1
    fi
    
    TOKEN=$(echo "$RESPONSE_BODY" | jq -r '.token')
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
    print_info "Uploading test document"
    
    # Create a test file if it doesn't exist
    if [ ! -f test.pdf ]; then
        print_info "Creating test PDF file"
        echo "This is a test PDF file" > test.pdf
    fi
    
    UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/documents" \
        -H "Authorization: Bearer $TOKEN" \
        -F "file=@test.pdf")
    
    echo "Upload response: $UPLOAD_RESPONSE"
    print_result "Document upload"
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