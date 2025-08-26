#!/bin/bash

echo "🧪 Testing TruckLagBE Monitoring Service"
echo "========================================"

# Base URL
BASE_URL="http://localhost:3000/api/v1"

echo ""
echo "1. Testing unoptimized endpoint (should be slow)..."
echo "   Making request to: $BASE_URL/drivers/1001/analytics/unoptimized"
START_TIME=$(date +%s%N)
curl -s "$BASE_URL/drivers/1001/analytics/unoptimized" > /dev/null
END_TIME=$(date +%s%N)
RESPONSE_TIME=$((($END_TIME - $START_TIME) / 1000000))
echo "   Response time: ${RESPONSE_TIME}ms"

echo ""
echo "2. Testing optimized endpoint (should be faster)..."
echo "   Making request to: $BASE_URL/drivers/1001/analytics"
START_TIME=$(date +%s%N)
curl -s "$BASE_URL/drivers/1001/analytics" > /dev/null
END_TIME=$(date +%s%N)
RESPONSE_TIME=$((($END_TIME - $START_TIME) / 1000000))
echo "   Response time: ${RESPONSE_TIME}ms"

echo ""
echo "3. Getting performance report..."
echo "   Requesting: $BASE_URL/drivers/performance/unoptimized"
curl -s "$BASE_URL/drivers/performance/unoptimized" | jq '.' 2>/dev/null || echo "   Response received (jq not available for formatting)"

echo ""
echo "4. Getting unoptimized endpoint metrics..."
echo "   Requesting: $BASE_URL/drivers/performance/unoptimized"
curl -s "$BASE_URL/drivers/performance/unoptimized" | jq '.' 2>/dev/null || echo "   Response received (jq not available for formatting)"

echo ""
echo "5. Getting optimized endpoint metrics..."
echo "   Requesting: $BASE_URL/drivers/performance/optimized"
curl -s "$BASE_URL/drivers/performance/optimized" | jq '.' 2>/dev/null || echo "   Response received (jq not available for formatting)"

echo ""
echo "✅ Monitoring test completed!"
echo "Check your application logs for detailed performance monitoring information."
echo ""
echo "Available monitoring endpoints:"
echo "  - $BASE_URL/drivers/performance/unoptimized (overall report)"
echo "  - $BASE_URL/drivers/performance/optimized (optimized endpoint metrics)"
echo "  - $BASE_URL/drivers/performance/unoptimized (unoptimized endpoint metrics)"
echo "  - $BASE_URL/drivers/performance/{endpoint}/history (performance history)" 