#!/bin/bash

# Test script for Turbulence API using curl
# Make sure your Next.js server is running on http://localhost:3000

echo "🧪 Testing Turbulence Forecast API with curl..."
echo ""

API_BASE_URL="http://localhost:3000"

# Test valid flight numbers
echo "✈️  Testing valid flight numbers:"
echo ""

test_flight() {
    local flight_number=$1
    echo "Testing flight: $flight_number"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/api/turbulence" \
        -H "Content-Type: application/json" \
        -d "{\"flightNumber\": \"$flight_number\"}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -eq 200 ]; then
        echo "✅ Success for $flight_number"
        echo "$body" | jq -r '.route | "   Route: \(.from) → \(.to)"'
        echo "$body" | jq -r '.forecast | length | "   Segments: \(.)"'
        echo "$body" | jq -r '.forecast[] | "   - \(.segment): \(.severity) (\(.probability * 100 | round)%))"'
    else
        echo "❌ Error for $flight_number (HTTP $http_code)"
        echo "$body"
    fi
    echo ""
}

# Test valid flights
test_flight "AA100"
test_flight "UA2457"
test_flight "DL1234"

# Test error cases
echo "🚨 Testing error cases:"
echo ""

test_error() {
    local flight_number=$1
    local description=$2
    
    echo "Testing $description: \"$flight_number\""
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/api/turbulence" \
        -H "Content-Type: application/json" \
        -d "{\"flightNumber\": \"$flight_number\"}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -eq 400 ]; then
        echo "✅ Correctly rejected: $description"
        echo "$body" | jq -r '.error'
    else
        echo "⚠️  Unexpected response for $description (HTTP $http_code)"
        echo "$body"
    fi
    echo ""
}

test_error "" "Empty flight number"
test_error "INVALID" "Invalid format"
test_error "123" "Numbers only"

# Test API documentation
echo "📚 Testing API documentation:"
echo ""

doc_response=$(curl -s -w "\n%{http_code}" "$API_BASE_URL/api/turbulence")
doc_http_code=$(echo "$doc_response" | tail -n1)
doc_body=$(echo "$doc_response" | head -n -1)

if [ "$doc_http_code" -eq 200 ]; then
    echo "✅ API Documentation accessible"
    echo "$doc_body" | jq -r '.message'
else
    echo "❌ Error accessing documentation (HTTP $doc_http_code)"
fi

echo ""
echo "🏁 Testing completed!"
