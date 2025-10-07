# Frontend Team: Fix VantagePoint CRM Amplify Deployment

## 🚨 URGENT ACTION REQUIRED

The VantagePoint CRM frontend is failing to deploy on AWS Amplify due to monorepo detection issues. The solution is to delete and recreate the Amplify app.

## Current Status
- **App URL**: https://dfh82x9nr61u2.amplifyapp.com
- **Status**: ❌ Failing - Can't find Next.js in monorepo
- **Backend API**: ✅ Working at https://3.83.217.40/api/v1

## Step-by-Step Fix (15 minutes)

### 1️⃣ Delete Current App (2 mins)
1. Go to: https://console.aws.amazon.com/amplify/home?region=us-east-1#/dfh82x9nr61u2
2. Click **"App settings"** → **"General"**
3. Scroll to bottom → Click red **"Delete app"** button
4. Type app name to confirm
5. Wait 30 seconds for deletion

### 2️⃣ Create New App (5 mins)
1. Go to: https://console.aws.amazon.com/amplify/home?region=us-east-1
2. Click **"New app"** → **"Host web app"**
3. Choose **GitHub**
4. Select repository: **cerberus100/Vantagepointcrm**
5. Select branch: **main**

### 3️⃣ Configure Build Settings (3 mins)

**CRITICAL**: When it asks about app structure:
- ❌ **DO NOT** select "Monorepo"
- ✅ **DO** select "Frontend only" or let it auto-detect

**Build Settings**:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend-nextjs
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend-nextjs/out
    files:
      - '**/*'
  cache:
    paths:
      - frontend-nextjs/node_modules/**/*
```

### 4️⃣ Set Environment Variables (2 mins)
Add these in Amplify console:
- `NEXT_PUBLIC_API_URL` = `https://3.83.217.40/api/v1`

### 5️⃣ Deploy (3 mins)
1. Click **"Save and deploy"**
2. Wait for build to complete
3. Test at the new URL

## What This Fixes
- ✅ Monorepo detection issues
- ✅ Next.js build failures
- ✅ Static export problems
- ✅ Clean deployment pipeline

## Testing After Deployment
1. Visit your Amplify URL
2. Click "Login"
3. Use: `admin` / `VantagePoint2024!`
4. Verify redirect to dashboard works

## If Issues Persist
1. Make sure `frontend-nextjs/next.config.js` has:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
```

2. Ensure the build completes the "Generating static pages" step

## Backend Team Note
Your API at https://3.83.217.40/api/v1 remains unchanged and functional. No backend changes needed.

---

**Time Required**: 15 minutes
**Risk**: None - backend unaffected
**Result**: Working frontend deployment
