# AWS Amplify Environment Variables Configuration

## Required Environment Variables for AWS Amplify Console

Configure these in: **Amplify Console > App > Environment Variables**

### Frontend Configuration Variables
```
# API Configuration
REACT_APP_API_BASE_URL=https://api.vantagepointcrm.com
NEXT_PUBLIC_API_BASE_URL=https://api.vantagepointcrm.com

# Environment
NODE_ENV=production
ENVIRONMENT=production

# Domain Configuration  
AMPLIFY_APP_ID=d3eve7po1zc3ec
CUSTOM_DOMAIN=vantagepointcrm.com
FRONTEND_URL=https://vantagepointcrm.com

# Cache Control
AMPLIFY_MONOREPO_APP_ROOT=aws_deploy
AMPLIFY_DIFF_DEPLOY=false

# Build Configuration
BUILD_OUTPUT_DIR=dist
SKIP_PREFLIGHT_CHECK=true
```

### How to Set These in Amplify Console:
1. Go to AWS Amplify Console
2. Select your app: **vantagepointcrm**
3. Go to **App settings > Environment variables**
4. Add each variable above
5. Redeploy the app

### Build Settings Override
Update your `amplify.yml` to use these variables:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - echo "API Base URL:" $REACT_APP_API_BASE_URL
        - echo "Environment:" $NODE_ENV
    build:
      commands:
        - echo "Building VantagePoint CRM Frontend"
        - mkdir -p dist
        - cp aws_deploy/index.html dist/
        - cp aws_deploy/login.html dist/
        - cp web/styles.css dist/
        - cp manifest.json dist/
        - echo "Frontend URL:" $FRONTEND_URL
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths: []
```