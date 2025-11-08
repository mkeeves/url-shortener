#!/bin/bash
# Quick test script for the URL shortener API

echo "Testing URL Shortener API..."
echo ""

echo "1. Testing GET (read URLs):"
curl -s -X GET https://url-shortener-api.mkeeves.workers.dev | jq . || echo "Failed or no jq installed"
echo ""

echo "2. Testing POST (create short URL):"
curl -s -X POST https://url-shortener-api.mkeeves.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"longUrl":"https://www.example.com/test","shortCode":"test123"}' | jq . || echo "Failed or no jq installed"
echo ""

echo "3. Testing GET again (verify URL was created):"
curl -s -X GET https://url-shortener-api.mkeeves.workers.dev | jq . || echo "Failed or no jq installed"
echo ""

echo "Done!"

