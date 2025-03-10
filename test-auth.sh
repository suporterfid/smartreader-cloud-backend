#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api"
API_KEY="EXAMPLE_API_KEY"

echo "Testing Authentication API"
echo "========================="

# Test user creation
echo -e "\n1. Creating a test user..."
curl --request POST \
  --url "$API_URL/auth/create" \
  --header "Content-Type: application/json" \
  --header "x-api-key: $API_KEY" \
  --data '{
    "username": "testuser",
    "password": "testpass123"
  }'

# Test user login with the default admin user
echo -e "\n\n2. Testing login with default admin user..."
curl --request POST \
  --url "$API_URL/auth/login" \
  --header "Content-Type: application/json" \
  --header "x-api-key: $API_KEY" \
  --data '{
    "username": "admin",
    "password": "admin123"
  }'

# Test user login with the new test user
echo -e "\n\n3. Testing login with new test user..."
curl --request POST \
  --url "$API_URL/auth/login" \
  --header "Content-Type: application/json" \
  --header "x-api-key: $API_KEY" \
  --data '{
    "username": "testuser",
    "password": "testpass123"
  }'

echo -e "\n\nTests completed."
