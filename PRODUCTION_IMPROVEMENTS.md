# Production Improvements Roadmap

## Current State (Quick Fix)
- Frontend: Hardcoded backend URL to `https://3.83.217.40/api/v1`
- Backend: Running on EC2 with self-signed certificate
- Working but not ideal for production

## Recommended Improvements

### 1. Backend Domain & SSL (Priority: HIGH)
**Current Issue:** Using IP address with self-signed cert
**Solution:** 
- Set up subdomain: `api.vantagepointcrm.com`
- Use AWS Certificate Manager for proper SSL
- Point domain to EC2 Elastic IP or Load Balancer

### 2. Environment Variables (Priority: HIGH)
**Current Issue:** Hardcoded API URL in frontend
**Solution:**
```bash
# In Amplify Console, set environment variable:
NEXT_PUBLIC_API_URL=https://api.vantagepointcrm.com/api/v1
```

### 3. Backend High Availability (Priority: MEDIUM)
**Current Issue:** Single EC2 instance
**Solutions:**
- Option A: AWS App Runner (managed, auto-scaling)
- Option B: ECS Fargate (more control, auto-scaling)
- Option C: Multiple EC2s behind ALB

### 4. Database Backups (Priority: HIGH)
**Current Issue:** No automated backups
**Solution:**
- Enable RDS automated backups
- Set retention period (7-30 days)
- Test restore procedure

### 5. Monitoring & Alerts (Priority: MEDIUM)
**Current Issue:** No monitoring
**Solution:**
- CloudWatch alarms for EC2/RDS
- Application monitoring (e.g., Sentry)
- Uptime monitoring

### 6. Security Improvements (Priority: HIGH)
- Remove hardcoded credentials
- Use AWS Secrets Manager
- Enable AWS WAF on CloudFront
- Regular security patches

## Implementation Order
1. Set up `api.vantagepointcrm.com` with proper SSL
2. Update frontend to use environment variables
3. Enable RDS backups
4. Add basic monitoring
5. Plan migration to managed service (App Runner/ECS)

## Cost Considerations
- Current: ~$50-100/month (EC2 + RDS)
- With improvements: ~$100-150/month
- Fully managed (App Runner): ~$150-200/month

## Quick Wins (Do Now)
1. Enable RDS automated backups
2. Set up CloudWatch alarms
3. Document current setup
