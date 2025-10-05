# 🚀 **Deploy Frontend to AWS Amplify**

## **📋 Quick Deployment Steps:**

### **Step 1: Connect to AWS Amplify Console**
1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click **"Connect app"**
3. Choose **"GitHub"** and authorize access
4. Select your repository: `vantagepointcrm`
5. Choose branch: `main`
6. Set build root: `frontend-nextjs`

### **Step 2: Configure Build Settings**
```yaml
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*
    appRoot: frontend-nextjs
```

### **Step 3: Add Environment Variables**
```
NEXT_PUBLIC_API_URL=https://production.eba-nti2hpvd.us-east-1.elasticbeanstalk.com/api/v1
```

### **Step 4: Deploy**
- Click **"Save and deploy"**
- Wait 2-3 minutes for build completion
- Your site will be live at: `https://main.your-app-id.amplifyapp.com`

### **Step 5: Connect Custom Domain** (if you have one)
1. In Amplify Console → **"Domain management"**
2. Click **"Add domain"**
3. Enter your domain (e.g., `vantagepointcrm.com`)
4. Configure DNS records as shown

## **🎯 Alternative: Manual CLI Deployment**

If you prefer CLI:

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure AWS (if not done)
amplify configure

# Initialize in frontend directory
cd frontend-nextjs
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

## **🔧 Environment Variables for Production:**

Add these to your Amplify environment variables:

```
NEXT_PUBLIC_API_URL=https://production.eba-nti2hpvd.us-east-1.elasticbeanstalk.com/api/v1
DATABASE_HOST=vantagepoint-production.c6ds4c4qok1n.us-east-1.rds.amazonaws.com
```

## **🎉 Result:**
- **Frontend:** `https://main.your-app-id.amplifyapp.com` (or your custom domain)
- **Backend:** `https://production.eba-nti2hpvd.us-east-1.elasticbeanstalk.com/api/v1`
- **Database:** `vantagepoint-production.c6ds4c4qok1n.us-east-1.rds.amazonaws.com`

## **🔑 Admin Login:**
- Visit your frontend URL
- Username: `admin`
- Password: `VantagePoint2024!`

## **📊 Monitoring:**
- **Amplify Console:** Build status, metrics, logs
- **Elastic Beanstalk:** Backend health, logs
- **RDS:** Database performance

**Your PostgreSQL/TypeORM backend is deployed and ready!** Just deploy the frontend to complete the full-stack system! 🎉
