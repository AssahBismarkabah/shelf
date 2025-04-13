#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Base URL for API
API_URL="http://localhost:8080/api"

# Function to print section headers
print_header() {
  echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# Function to make API calls and handle responses
api_call() {
  local method=$1
  local endpoint=$2
  local data=$3
  local token=$4
  
  local cmd="curl -s -X $method $API_URL$endpoint"
  
  if [ ! -z "$data" ]; then
    cmd="$cmd -H 'Content-Type: application/json' -d '$data'"
  fi
  
  if [ ! -z "$token" ]; then
    cmd="$cmd -H 'Authorization: Bearer $token'"
  fi
  
  echo -e "${GREEN}Executing: $cmd${NC}"
  eval $cmd
}

# Function to check if a command was successful
check_result() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Success${NC}"
  else
    echo -e "${RED}✗ Failed${NC}"
    exit 1
  fi
}

# Function to extract values from JSON response
extract_value() {
  local json=$1
  local key=$2
  echo $json | jq -r ".$key"
}

# Function to save token to file
save_token() {
  echo $1 > .token
  echo -e "${GREEN}Token saved to .token file${NC}"
}

# Function to save subscription ID to file
save_subscription_id() {
  echo $1 > .subscription_id
  echo -e "${GREEN}Subscription ID saved to .subscription_id file${NC}"
}

# Function to save document ID to file
save_document_id() {
  echo $1 > .doc_id
  echo -e "${GREEN}Document ID saved to .doc_id file${NC}"
}

# Function to register a new user
register_user() {
  print_header "Registering User"
  register_response=$(api_call "POST" "/auth/register" '{"email":"test@example.com","password":"password123","full_name":"Test User"}')
  check_result
  echo $register_response | jq .
}

# Function to login user
login_user() {
  print_header "Logging In User"
  login_response=$(api_call "POST" "/auth/login" '{"email":"test@example.com","password":"password123"}')
  check_result
  token=$(extract_value "$login_response" "token")
  save_token "$token"
  echo $login_response | jq .
}

# Function to create a subscription
create_subscription() {
  print_header "Creating Subscription"
  if [ -z "$1" ]; then
    plan="basic"
  else
    plan=$1
  fi
  
  if [ ! -f ".token" ]; then
    echo -e "${RED}Error: Token file not found. Please login first.${NC}"
    exit 1
  fi
  
  token=$(cat .token)
  subscription_response=$(api_call "POST" "/subscription" "{\"plan\":\"$plan\"}" "$token")
  check_result
  subscription_id=$(extract_value "$subscription_response" "id")
  save_subscription_id "$subscription_id"
  echo $subscription_response | jq .
}

# Function to get subscription details
get_subscription() {
  print_header "Getting Subscription Details"
  if [ ! -f ".token" ]; then
    echo -e "${RED}Error: Token file not found. Please login first.${NC}"
    exit 1
  fi
  
  token=$(cat .token)
  get_subscription_response=$(api_call "GET" "/subscription" "" "$token")
  check_result
  echo $get_subscription_response | jq .
}

# Function to upload a document
upload_document() {
  print_header "Uploading Document"
  if [ ! -f ".token" ]; then
    echo -e "${RED}Error: Token file not found. Please login first.${NC}"
    exit 1
  fi
  
  token=$(cat .token)
  
  # Create a small test file if it doesn't exist
  if [ ! -f "test_doc.txt" ]; then
    echo "Test content" > test_doc.txt
  fi
  
  upload_response=$(curl -s -X POST "$API_URL/documents" \
    -H "Authorization: Bearer $token" \
    -F "file=@test_doc.txt" \
    -F "filename=test_doc.txt" \
    -F "mime_type=text/plain")
  check_result
  doc_id=$(extract_value "$upload_response" "id")
  save_document_id "$doc_id"
  echo $upload_response | jq .
}

# Function to list documents
list_documents() {
  print_header "Listing Documents"
  if [ ! -f ".token" ]; then
    echo -e "${RED}Error: Token file not found. Please login first.${NC}"
    exit 1
  fi
  
  token=$(cat .token)
  list_response=$(api_call "GET" "/documents" "" "$token")
  check_result
  echo $list_response | jq .
}

# Function to download a document
download_document() {
  print_header "Downloading Document"
  if [ ! -f ".token" ]; then
    echo -e "${RED}Error: Token file not found. Please login first.${NC}"
    exit 1
  fi
  
  if [ ! -f ".doc_id" ]; then
    echo -e "${RED}Error: Document ID file not found. Please upload a document first.${NC}"
    exit 1
  fi
  
  token=$(cat .token)
  doc_id=$(cat .doc_id)
  
  download_response=$(curl -s -X GET "$API_URL/documents/$doc_id" \
    -H "Authorization: Bearer $token" \
    -o downloaded_doc.txt)
  check_result
  echo "Document downloaded to downloaded_doc.txt"
}

# Function to delete a document
delete_document() {
  print_header "Deleting Document"
  if [ ! -f ".token" ]; then
    echo -e "${RED}Error: Token file not found. Please login first.${NC}"
    exit 1
  fi
  
  if [ ! -f ".doc_id" ]; then
    echo -e "${RED}Error: Document ID file not found. Please upload a document first.${NC}"
    exit 1
  fi
  
  token=$(cat .token)
  doc_id=$(cat .doc_id)
  
  delete_response=$(api_call "DELETE" "/documents/$doc_id" "" "$token")
  check_result
  echo $delete_response | jq .
}

# Function to cancel subscription
cancel_subscription() {
  print_header "Canceling Subscription"
  if [ ! -f ".token" ]; then
    echo -e "${RED}Error: Token file not found. Please login first.${NC}"
    exit 1
  fi
  
  token=$(cat .token)
  cancel_response=$(api_call "POST" "/subscription/cancel" "" "$token")
  check_result
  echo $cancel_response | jq .
}

# Function to test unlimited uploads
test_unlimited_uploads() {
  print_header "Testing Unlimited Uploads"
  if [ ! -f ".token" ]; then
    echo -e "${RED}Error: Token file not found. Please login first.${NC}"
    exit 1
  fi
  
  token=$(cat .token)
  
  # Create test files
  for i in {1..20}; do
    echo "Test content $i" > "test_doc_$i.txt"
  done
  
  # Upload test files
  for i in {1..20}; do
    upload_response=$(curl -s -X POST "$API_URL/documents" \
      -H "Authorization: Bearer $token" \
      -F "file=@test_doc_$i.txt" \
      -F "filename=test_doc_$i.txt" \
      -F "mime_type=text/plain")
    doc_id=$(extract_value "$upload_response" "id")
    echo "Uploaded document $i: $doc_id"
  done
  
  # List all documents
  list_response=$(api_call "GET" "/documents" "" "$token")
  doc_count=$(echo $list_response | jq '. | length')
  echo "Total documents: $doc_count"
  
  # Clean up test files
  for i in {1..20}; do
    rm -f "test_doc_$i.txt"
  done
}

# Function to run all tests
run_all_tests() {
  register_user
  login_user
  create_subscription "basic"
  get_subscription
  upload_document
  list_documents
  download_document
  create_subscription "premium"
  get_subscription
  test_unlimited_uploads
  cancel_subscription
  print_header "All Tests Completed Successfully!"
}

# Function to show help
show_help() {
  echo -e "${BLUE}PDF Shelf Subscription Test API${NC}"
  echo -e "Usage: $0 [command]"
  echo -e "\nCommands:"
  echo -e "  ${GREEN}register${NC}       Register a new user"
  echo -e "  ${GREEN}login${NC}          Login with registered user"
  echo -e "  ${GREEN}create${NC} [plan]  Create a subscription (free/basic/premium)"
  echo -e "  ${GREEN}get${NC}            Get subscription details"
  echo -e "  ${GREEN}upload${NC}         Upload a test document"
  echo -e "  ${GREEN}list${NC}           List all documents"
  echo -e "  ${GREEN}download${NC}       Download a document"
  echo -e "  ${GREEN}delete${NC}         Delete a document"
  echo -e "  ${GREEN}unlimited${NC}      Test unlimited uploads"
  echo -e "  ${GREEN}cancel${NC}         Cancel subscription"
  echo -e "  ${GREEN}all${NC}            Run all tests"
  echo -e "  ${GREEN}help${NC}           Show this help message"
}

# Main script
case "$1" in
  register)
    register_user
    ;;
  login)
    login_user
    ;;
  create)
    create_subscription "$2"
    ;;
  get)
    get_subscription
    ;;
  upload)
    upload_document
    ;;
  list)
    list_documents
    ;;
  download)
    download_document
    ;;
  delete)
    delete_document
    ;;
  unlimited)
    test_unlimited_uploads
    ;;
  cancel)
    cancel_subscription
    ;;
  all)
    run_all_tests
    ;;
  help|*)
    show_help
    ;;
esac 