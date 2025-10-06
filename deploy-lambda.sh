#!/bin/bash

# Deploy VantagePoint CRM Lambda Function with Fixed Dependencies
echo "🚀 Deploying VantagePoint CRM Lambda Function..."

# Set variables
FUNCTION_NAME="cura-genesis-crm-api"
REGION="us-east-1"
LAMBDA_FILE="backend_team_handoff/lambda_function.py"
REQUIREMENTS_FILE="lambda-requirements.txt"
ZIP_FILE="lambda-deployment.zip"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

echo "📦 Creating deployment package..."

# Create temporary directory for packaging
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Copy Lambda function
cp "$LAMBDA_FILE" .

# Install Python dependencies
pip install -r "../$REQUIREMENTS_FILE" -t .

# Create ZIP file
zip -r "$ZIP_FILE" .

# Move ZIP file to project root
mv "$ZIP_FILE" "../"

# Clean up
cd ..
rm -rf "$TEMP_DIR"

echo "✅ Deployment package created: $ZIP_FILE"

# Deploy to AWS Lambda
echo "🔄 Updating Lambda function..."
aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file "fileb://$ZIP_FILE" \
    --region "$REGION"

if [ $? -eq 0 ]; then
    echo "✅ Lambda function updated successfully!"
    echo ""
    echo "🔍 Testing endpoints..."
    echo ""
    echo "Health check:"
    curl -s "https://blyqk7itsc.execute-api.us-east-1.amazonaws.com/prod/health" | jq .

    echo ""
    echo "📋 Deployment complete! The following endpoints should now work:"
    echo "• Health: https://blyqk7itsc.execute-api.us-east-1.amazonaws.com/prod/health"
    echo "• Login: POST https://blyqk7itsc.execute-api.us-east-1.amazonaws.com/prod/api/v1/auth/login"
    echo "• Leads: GET https://blyqk7itsc.execute-api.us-east-1.amazonaws.com/prod/api/v1/leads"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Test login with: admin / admin123"
    echo "2. Run lead injection script: python backend_team_handoff/smart_lead_injection_api.py"
    echo "3. Deploy Next.js frontend to AWS Amplify"
else
    echo "❌ Failed to update Lambda function"
    exit 1
fi
