# Backend Team Handoff: VantagePoint CRM Issues

## Executive Summary
The VantagePoint CRM application is experiencing critical deployment and integration issues between the frontend (Next.js on AWS Amplify) and backend (NestJS on EC2). Multiple attempts to deploy have revealed fundamental architectural and configuration problems that need to be addressed.

## Current Architecture
- **Frontend**: Next.js app deployed on AWS Amplify (attempting SSR but failing)
- **Backend**: NestJS API running in Docker on EC2 (https://3.83.217.40/api/v1)
- **Database**: AWS RDS PostgreSQL
- **Repository**: Monorepo structure with `/frontend-nextjs` and `/backend-nestjs` directories

## Critical Issues

### 1. Next.js SSR vs Static Export Conflict
**Problem**: The frontend is configured for Server-Side Rendering (SSR) but Amplify keeps building it as static HTML.

**Details**:
- Next.js 13+ App Router defaults to static generation
- Login redirect using `router.push('/')` fails in static builds
- Had to use `window.location.href` as workaround (not ideal)

**Required Fix**:
```javascript
// frontend-nextjs/src/app/page.tsx
// Add this to force dynamic rendering:
export const dynamic = 'force-dynamic'
export const revalidate = 0

// OR switch back to static export in next.config.js:
module.exports = {
  output: 'export',
  // ... other config
}
```

### 2. Monorepo Structure Issues with Amplify
**Problem**: Amplify can't find the Next.js app in the monorepo structure.

**Current Attempts**:
- Set `AMPLIFY_MONOREPO_APP_ROOT=frontend-nextjs`
- Modified build spec to remove `cd` commands
- Still failing to detect Next.js properly

**Required Fix**:
Consider splitting the repository:
- Move frontend to `github.com/cerberus100/vantagepointcrm-frontend`
- Move backend to `github.com/cerberus100/vantagepointcrm-backend`
- This would eliminate all monorepo-related issues

### 3. Authentication Flow Issues
**Problem**: Login works but redirect fails, suggesting frontend/backend state mismatch.

**Current Flow**:
1. User logs in → Backend returns JWT token
2. Frontend stores token in localStorage
3. Frontend tries to redirect using Next.js router → FAILS in static build
4. Using `window.location.href` works but is not optimal

**Required Fix**:
- Implement proper session management
- Consider server-side sessions or cookies instead of localStorage
- Ensure CORS headers include credentials support

### 4. CORS Configuration
**Problem**: Current CORS setup may be too permissive or incorrectly configured.

**Current Backend CORS**:
```typescript
app.enableCors({
  origin: true, // This accepts ALL origins - security risk!
  credentials: true,
});
```

**Required Fix**:
```typescript
app.enableCors({
  origin: [
    'https://dfh82x9nr61u2.amplifyapp.com',
    'https://vantagepointcrm.com', // your custom domain
    'http://localhost:3000' // for local development only
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### 5. Database Schema Issues
**Problem**: Manual schema creation led to missing columns and type mismatches.

**Issues Found**:
- Missing `password_changed_at` column in users table
- TypeORM entity decorators being stripped by webpack
- Schema not properly synchronized

**Required Fix**:
1. Enable TypeORM synchronization temporarily:
```typescript
TypeOrmModule.forRoot({
  synchronize: true, // Only in development!
  // ... other config
})
```
2. Run migrations to capture schema
3. Disable synchronization for production

### 6. Environment Configuration
**Problem**: Inconsistent environment variables between local, Docker, and production.

**Required Fix**:
Create proper `.env` files:
```bash
# .env.production
NODE_ENV=production
DATABASE_HOST=vantagepoint-production.c6ds4c4qok1n.us-east-1.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=VantagePoint2024!
DATABASE_NAME=vantagepointcrm
JWT_SECRET=VantagePoint2024!SecretKey
JWT_EXPIRES_IN=24h
PORT=8080
```

## Recommended Solutions

### Option 1: Fix Current Architecture (Complex)
1. **Frontend**: Force Next.js to use SSR properly
   - Add `export const dynamic = 'force-dynamic'` to all pages
   - Or switch to static export with proper client-side routing
2. **Backend**: Fix CORS and ensure proper API responses
3. **Deployment**: Split repositories or create proper monorepo build pipeline

### Option 2: Simplify Architecture (Recommended)
1. **Frontend**: Use static export (`output: 'export'`)
   - Simpler, cheaper, faster
   - Works well with Amplify
   - No SSR complications
2. **Backend**: Keep on EC2 with proper CORS
3. **Auth**: Use cookie-based sessions instead of localStorage

### Option 3: Full AWS Integration
1. **Frontend**: Deploy to CloudFront + S3 (static)
2. **Backend**: Migrate to AWS Lambda + API Gateway
3. **Auth**: Use AWS Cognito
4. **Benefits**: Better integration, auto-scaling, managed services

## Immediate Actions Required

1. **Fix CORS Configuration**
   - Update backend to use specific allowed origins
   - Test with production domain

2. **Decide on Frontend Architecture**
   - Static export (simple, recommended)
   - OR proper SSR setup (complex, more features)

3. **Fix Authentication Flow**
   - Implement proper redirect handling
   - Consider cookie-based auth for SSR

4. **Database Schema**
   - Create proper migration scripts
   - Document all schema changes

5. **Monitoring**
   - Add CloudWatch logs
   - Implement error tracking
   - Set up alerts for failures

## Testing Checklist
- [ ] User can access frontend at https://dfh82x9nr61u2.amplifyapp.com
- [ ] User can login with admin/VantagePoint2024!
- [ ] After login, user is redirected to dashboard
- [ ] API calls from frontend to backend work
- [ ] CORS errors are resolved
- [ ] SSL certificates are valid
- [ ] Database connections are stable

## Contact for Questions
Current issues were discovered during deployment attempts from October 4-6, 2025.
Frontend attempts included static export, SSR, and various Amplify configurations.
Backend is stable but needs CORS and environment fixes.

## Recommended Timeline
1. Day 1: Fix CORS and test basic connectivity
2. Day 2: Decide on and implement frontend architecture
3. Day 3: Fix authentication flow
4. Day 4: Testing and monitoring setup
5. Day 5: Production deployment

The main blocker is the frontend/backend integration, specifically around authentication redirects and CORS configuration. The backend API is working correctly when tested directly.
