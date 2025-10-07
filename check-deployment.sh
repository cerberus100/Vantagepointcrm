#!/bin/bash

echo "=== VantagePoint CRM Deployment Status ==="
echo

echo "1. Backend Status (EC2):"
echo -n "   API Health: "
curl -s -o /dev/null -w "%{http_code}" https://3.83.217.40/api/v1/health --insecure || echo "Connection failed"
echo
echo -n "   Login Endpoint: "
curl -s -o /dev/null -w "%{http_code}" https://3.83.217.40/api/v1/auth/login --insecure || echo "Connection failed"
echo

echo
echo "2. Frontend Status (Amplify):"
echo -n "   Homepage: "
curl -s -o /dev/null -w "%{http_code}" https://main.dfh82x9nr61u2.amplifyapp.com || echo "Not yet deployed"
echo
echo -n "   Login Page: "
curl -s -o /dev/null -w "%{http_code}" https://main.dfh82x9nr61u2.amplifyapp.com/login || echo "Not yet deployed"
echo

echo
echo "3. Test Login Command:"
echo "   curl -X POST https://3.83.217.40/api/v1/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"username\":\"admin\",\"password\":\"VantagePoint2024!\"}' \\"
echo "     --insecure"
echo

echo "=== Check Amplify Console for build status ==="
echo "https://console.aws.amazon.com/amplify/"
