# VantagePoint CRM CI/CD Pipeline

This directory contains GitHub Actions workflows for the VantagePoint CRM system, providing automated testing, security scanning, and deployment capabilities.

## 🚀 **Workflows Overview**

### **1. Main CI/CD Pipeline** (`ci-cd.yml`)
The primary workflow that orchestrates the entire CI/CD process:

- **Code Quality & Security Checks**
- **Unit & Integration Tests**
- **Security & Compliance Scanning**
- **Build & Package**
- **Automated Deployments** (dev → staging → production)
- **Notifications**

### **2. Security Scanning** (`security.yml`)
Comprehensive security scanning workflow:

- **Dependency Vulnerability Scanning**
- **Container Security Scanning**
- **Infrastructure Security Scanning**
- **Secrets Scanning**
- **Code Quality & Security Analysis**
- **Compliance Checks** (HIPAA, SOC 2, GDPR)

### **3. Automated Testing** (`test.yml`)
Dedicated testing workflow:

- **Unit Tests**
- **Integration Tests**
- **End-to-End Tests**
- **Performance Tests**
- **API Contract Tests**

### **4. Infrastructure Validation** (`infrastructure.yml`)
Infrastructure-specific validation:

- **Infrastructure Synthesis**
- **Security Scanning**
- **Cost Estimation**
- **Infrastructure Validation**
- **Infrastructure Diff**
- **Deployment Dry Run**

## 🔧 **Workflow Triggers**

### **Automatic Triggers**
- **Push to main/develop**: Full CI/CD pipeline
- **Pull Requests**: Code quality, testing, and security checks
- **Scheduled**: Daily security scans and tests

### **Manual Triggers**
- **Workflow Dispatch**: Manual deployment to specific environments
- **Environment-specific**: Deploy to dev, staging, or production

## 📊 **Pipeline Stages**

### **Stage 1: Code Quality & Security**
- ✅ Frontend linting and type checking
- ✅ Backend linting and type checking
- ✅ Infrastructure synthesis
- ✅ Security vulnerability scanning
- ✅ Dependency audit

### **Stage 2: Testing**
- ✅ Unit tests (frontend & backend)
- ✅ Integration tests with database
- ✅ End-to-end tests with Playwright
- ✅ Performance tests
- ✅ API contract validation

### **Stage 3: Security & Compliance**
- ✅ Trivy vulnerability scanning
- ✅ Checkov infrastructure security
- ✅ CodeQL analysis
- ✅ Secrets scanning
- ✅ Compliance checks (HIPAA, SOC 2, GDPR)

### **Stage 4: Build & Package**
- ✅ Frontend build
- ✅ Backend build
- ✅ Artifact generation
- ✅ Package validation

### **Stage 5: Deployment**
- ✅ **Development**: Automatic deployment on develop branch
- ✅ **Staging**: Automatic deployment on main branch
- ✅ **Production**: Manual approval required

## 🔒 **Security Features**

### **Vulnerability Scanning**
- **Dependencies**: npm audit for all projects
- **Containers**: Trivy scanning for Docker images
- **Infrastructure**: Checkov for CloudFormation templates
- **Secrets**: GitLeaks and TruffleHog scanning

### **Compliance Monitoring**
- **HIPAA**: Healthcare data protection compliance
- **SOC 2**: Security and availability controls
- **GDPR**: Data privacy and protection
- **OWASP**: Web application security standards

### **Code Quality**
- **ESLint**: Code style and security rules
- **TypeScript**: Type safety validation
- **Prettier**: Code formatting
- **CodeQL**: Static analysis for security vulnerabilities

## 🧪 **Testing Strategy**

### **Unit Tests**
- **Frontend**: React component testing with Jest
- **Backend**: Service and controller testing
- **Coverage**: Minimum 80% code coverage required

### **Integration Tests**
- **Database**: PostgreSQL integration tests
- **Cache**: Redis integration tests
- **API**: Endpoint integration testing

### **End-to-End Tests**
- **Playwright**: Cross-browser testing
- **User Flows**: Complete user journey testing
- **Mobile**: Responsive design testing

### **Performance Tests**
- **Load Testing**: Artillery for API load testing
- **Frontend**: Lighthouse performance audits
- **Database**: Query performance testing

## 🚀 **Deployment Strategy**

### **Environment Promotion**
```
develop → staging → production
```

### **Deployment Types**
- **Blue-Green**: Zero-downtime deployments
- **Canary**: Gradual rollout with monitoring
- **Rollback**: Automatic rollback on failure

### **Environment Configuration**
- **Development**: Cost-optimized, single AZ
- **Staging**: Production-like, multi-AZ
- **Production**: High-availability, full security

## 📈 **Monitoring & Observability**

### **Pipeline Metrics**
- **Build Time**: Track pipeline execution time
- **Test Coverage**: Monitor code coverage trends
- **Security Issues**: Track vulnerability counts
- **Deployment Success**: Monitor deployment success rates

### **Notifications**
- **Slack**: Real-time pipeline notifications
- **Email**: Critical failure alerts
- **GitHub**: PR comments with results

## 🔧 **Configuration**

### **Required Secrets**
```yaml
AWS_ACCESS_KEY_ID: AWS access key for deployments
AWS_SECRET_ACCESS_KEY: AWS secret key for deployments
GITHUB_TOKEN: GitHub token for API access
```

### **Environment Variables**
```yaml
NODE_VERSION: '18'
AWS_REGION: 'us-east-1'
```

### **Branch Protection Rules**
- **main**: Requires PR review and passing CI
- **develop**: Requires passing CI
- **feature/***: Requires passing CI

## 📋 **Usage Examples**

### **Manual Deployment**
```bash
# Deploy to development
gh workflow run ci-cd.yml -f environment=dev

# Deploy to staging
gh workflow run ci-cd.yml -f environment=staging

# Deploy to production
gh workflow run ci-cd.yml -f environment=production
```

### **Running Specific Workflows**
```bash
# Run security scan
gh workflow run security.yml

# Run tests only
gh workflow run test.yml

# Validate infrastructure
gh workflow run infrastructure.yml
```

## 🐛 **Troubleshooting**

### **Common Issues**

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review build logs for specific errors

2. **Test Failures**
   - Check database connection in integration tests
   - Verify test data setup
   - Review test environment configuration

3. **Security Scan Failures**
   - Review vulnerability reports
   - Update dependencies with security patches
   - Fix infrastructure security issues

4. **Deployment Failures**
   - Check AWS credentials and permissions
   - Verify environment configuration
   - Review CloudFormation stack events

### **Debug Commands**
```bash
# Check workflow status
gh run list

# View workflow logs
gh run view <run-id>

# Download artifacts
gh run download <run-id>
```

## 📚 **Best Practices**

### **Code Quality**
- Write comprehensive tests for all new features
- Maintain high code coverage (>80%)
- Follow consistent coding standards
- Use TypeScript for type safety

### **Security**
- Regular dependency updates
- Security-first development approach
- Regular security scanning
- Compliance monitoring

### **Deployment**
- Test in development first
- Use feature flags for gradual rollouts
- Monitor deployments closely
- Have rollback plans ready

## 🔗 **Related Documentation**

- [Backend Testing Guide](../backend-nestjs/README.md#testing)
- [Frontend Testing Guide](../frontend-nextjs/README.md#testing)
- [Infrastructure Deployment Guide](../infrastructure/DEPLOYMENT_GUIDE.md)
- [Security Documentation](../infrastructure/SECURITY.md)

---

**Last Updated**: October 2024  
**Maintained By**: DevOps Team  
**Contact**: devops@vantagepointcrm.com
