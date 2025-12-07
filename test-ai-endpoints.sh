#!/bin/bash

echo "🤖 TESTING AI ENDPOINTS - Nostromo Guardian"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000/api/v1"

# Test 1: AI Trade Analysis
echo -e "${BLUE}1️⃣ Testing AI Trade Analysis${NC}"
echo "POST $BASE_URL/ai/analyze-trade"
echo ""

curl -s -X POST "$BASE_URL/ai/analyze-trade" \
  -H 'Content-Type: application/json' \
  -d '{
    "trade": {
      "amount": 15000000,
      "token_name": "QMINE",
      "source_address": "QUBICABC123",
      "dest_address": "QUBICXYZ789",
      "price_estimate": 1.5
    },
    "context": {
      "token_volume_24h": 500000000,
      "token_holders": 266,
      "trader_rank": 3,
      "trader_trade_count": 45
    }
  }' | jq '.'

echo ""
echo "---"
echo ""

# Test 2: AI Announcement Generator
echo -e "${BLUE}2️⃣ Testing AI Announcement Generator${NC}"
echo "POST $BASE_URL/ai/generate-announcement"
echo ""

curl -s -X POST "$BASE_URL/ai/generate-announcement" \
  -H 'Content-Type: application/json' \
  -d '{
    "event_type": "whale.buy",
    "data": {
      "amount": 15000000,
      "token_name": "QMINE",
      "source_address": "QUBICABC123",
      "tick": 15234567,
      "usd_value_estimate": 22500
    }
  }' | jq '.'

echo ""
echo "---"
echo ""

# Test 3: AI Address Analysis
echo -e "${BLUE}3️⃣ Testing AI Address Analysis${NC}"
echo "GET $BASE_URL/ai/analyze-address/EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
echo ""

curl -s "$BASE_URL/ai/analyze-address/EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" | jq '.'

echo ""
echo "---"
echo ""

# Test 4: AI Market Summary
echo -e "${BLUE}4️⃣ Testing AI Market Summary${NC}"
echo "GET $BASE_URL/ai/market-summary"
echo ""

curl -s "$BASE_URL/ai/market-summary" | jq '.'

echo ""
echo "---"
echo ""

echo -e "${GREEN}✅ All AI endpoint tests completed!${NC}"
echo ""
echo -e "${YELLOW}💡 Note: AI responses may take 1-3 seconds to generate${NC}"
echo -e "${YELLOW}💰 Each request costs approximately $0.03-0.08${NC}"
