#!/bin/bash

# Test script for cnctd.ai API endpoints
# Usage: ./test-endpoints.sh [base_url]

BASE_URL="${1:-http://localhost:8787}"
API_URL="$BASE_URL/api"

echo "Testing cnctd.ai API at $API_URL"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test health endpoint
echo -e "\n${GREEN}Testing health endpoint...${NC}"
curl -s "$BASE_URL/" | jq .

# Test signup
echo -e "\n${GREEN}Testing signup...${NC}"
SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }')

echo $SIGNUP_RESPONSE | jq .

# Extract token
TOKEN=$(echo $SIGNUP_RESPONSE | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓ Signup successful${NC}"
else
  echo -e "${RED}✗ Signup failed${NC}"
  exit 1
fi

# Test login
echo -e "\n${GREEN}Testing login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }')

echo $LOGIN_RESPONSE | jq .

# Test avatars list
echo -e "\n${GREEN}Testing avatars list...${NC}"
curl -s "$API_URL/avatars" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Get first avatar ID
AVATAR_ID=$(curl -s "$API_URL/avatars" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.avatars[0].id')

echo "Using avatar ID: $AVATAR_ID"

# Test avatar details
echo -e "\n${GREEN}Testing avatar details...${NC}"
curl -s "$API_URL/avatars/$AVATAR_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Test start conversation
echo -e "\n${GREEN}Testing start conversation...${NC}"
CONV_RESPONSE=$(curl -s -X POST "$API_URL/conversations/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"avatarId\": \"$AVATAR_ID\"
  }")

echo $CONV_RESPONSE | jq .

CONVERSATION_ID=$(echo $CONV_RESPONSE | jq -r '.conversation.id')

echo "Conversation ID: $CONVERSATION_ID"

# Test list conversations
echo -e "\n${GREEN}Testing list conversations...${NC}"
curl -s "$API_URL/conversations" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Test get messages
echo -e "\n${GREEN}Testing get messages...${NC}"
curl -s "$API_URL/conversations/$CONVERSATION_ID/messages" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo -e "\n${GREEN}All tests completed!${NC}"
echo "WebSocket endpoint: ws://${BASE_URL#http://}/api/chat/$CONVERSATION_ID/ws?userId=xxx&avatarId=$AVATAR_ID&token=$TOKEN"
