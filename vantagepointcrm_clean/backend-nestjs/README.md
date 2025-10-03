# 🚀 VantagePoint CRM - Modern NestJS Backend

A modern, scalable, and secure CRM backend built with NestJS, TypeScript, PostgreSQL, and AWS services.

## ✨ Features

### 🔐 Security
- **JWT Authentication** with Passport strategies
- **Role-based Access Control** (Admin, Manager, Agent)
- **Password Hashing** with bcrypt (12 rounds)
- **Input Validation** with class-validator
- **Rate Limiting** with Redis
- **Audit Logging** for all sensitive operations
- **CORS Protection** with configurable origins

### 🏗️ Architecture
- **Modular Design** with clean separation of concerns
- **Dependency Injection** for testable code
- **TypeORM** for database operations
- **PostgreSQL** with proper indexing
- **Redis** for caching and rate limiting
- **Swagger Documentation** with OpenAPI 3.0

### 📊 Analytics & Reporting
- **Dashboard Statistics** with real-time metrics
- **Lead Conversion Tracking** with performance analytics
- **User Performance Metrics** with top performers
- **Activity Timeline** with daily breakdowns
- **Comprehensive Reporting** for business insights

### 🛡️ Production Ready
- **Health Checks** for monitoring
- **Structured Logging** with Winston
- **Error Handling** with centralized filters
- **Request/Response Interceptors** for logging
- **Database Migrations** with TypeORM
- **Environment Configuration** with validation

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 13+
- Redis 6+
- AWS Account (for production)

### Installation

1. **Clone and Install Dependencies**
```bash
cd backend-nestjs
npm install
```

2. **Environment Setup**
```bash
cp env.example .env
# Edit .env with your configuration
```

3. **Database Setup**
```bash
# Create database
createdb vantagepointcrm

# Run migrations
npm run migration:run

# Seed initial data (optional)
npm run seed:run
```

4. **Start Development Server**
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000/api/v1`

## 📚 API Documentation

### Swagger UI
- **Development**: `http://localhost:3000/api/docs`
- **Production**: `https://your-domain.com/api/docs`

### Authentication
All endpoints (except health checks) require JWT authentication:

```bash
# Login to get token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-password"}'

# Use token in subsequent requests
curl -X GET http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Key Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/change-password` - Change password
- `GET /auth/profile` - Get user profile

#### Users Management
- `GET /users` - List users (Admin/Manager only)
- `POST /users` - Create user (Admin/Manager only)
- `GET /users/:id` - Get user details
- `PATCH /users/:id` - Update user
- `PATCH /users/:id/activate` - Activate user
- `PATCH /users/:id/deactivate` - Deactivate user

#### Leads Management
- `GET /leads` - List leads with filtering
- `POST /leads` - Create lead
- `GET /leads/:id` - Get lead details
- `PATCH /leads/:id` - Update lead
- `DELETE /leads/:id` - Delete lead (Admin/Manager only)

#### Analytics
- `GET /analytics/dashboard` - Dashboard statistics
- `GET /analytics/conversion-metrics` - Lead conversion metrics
- `GET /analytics/user-performance` - User performance data
- `GET /analytics/activity-timeline` - Activity timeline

#### Health Checks
- `GET /health` - Comprehensive health check
- `GET /health/ready` - Readiness check
- `GET /health/live` - Liveness check

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE vantagepoint.users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'agent',
  is_active BOOLEAN DEFAULT true,
  manager_id INTEGER REFERENCES vantagepoint.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Leads Table
```sql
CREATE TABLE vantagepoint.leads (
  id SERIAL PRIMARY KEY,
  practice_name VARCHAR(255) NOT NULL,
  npi VARCHAR(10),
  phone VARCHAR(20),
  email VARCHAR(255),
  state VARCHAR(2),
  city VARCHAR(100),
  address TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  status VARCHAR(20) DEFAULT 'new',
  priority VARCHAR(10) DEFAULT 'medium',
  lead_type VARCHAR(20) DEFAULT 'general',
  assigned_user_id INTEGER REFERENCES vantagepoint.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Audit Logs Table
```sql
CREATE TABLE vantagepoint.audit_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  event_type VARCHAR(50) NOT NULL,
  user_id INTEGER REFERENCES vantagepoint.users(id),
  username VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  details JSONB,
  success BOOLEAN DEFAULT true,
  error_message TEXT
);
```

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=vantagepointcrm
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your-password

# JWT
JWT_SECRET_ARN=arn:aws:secretsmanager:region:account:secret:name
JWT_EXPIRES_IN=1h

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Security
BCRYPT_ROUNDS=12
PASSWORD_MIN_LENGTH=12

# CORS
CORS_ORIGINS=http://localhost:3000,https://your-frontend.com
```

## 🚀 Deployment

### AWS Lambda Deployment

1. **Build the Application**
```bash
npm run build
```

2. **Create Lambda Package**
```bash
# Install serverless framework
npm install -g serverless

# Deploy to AWS
serverless deploy
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
```

### Production Checklist

- [ ] Set up PostgreSQL with proper indexing
- [ ] Configure Redis for caching and rate limiting
- [ ] Set up AWS Secrets Manager for JWT secrets
- [ ] Configure CloudWatch for logging
- [ ] Set up monitoring and alerting
- [ ] Configure SSL/TLS certificates
- [ ] Set up backup and disaster recovery
- [ ] Configure CORS for production domains
- [ ] Set up rate limiting for production traffic
- [ ] Configure audit logging retention

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

## 📊 Monitoring & Observability

### Health Checks
- **Liveness**: `GET /health/live`
- **Readiness**: `GET /health/ready`
- **Comprehensive**: `GET /health`

### Logging
- **Structured JSON logs** with correlation IDs
- **Request/Response logging** with performance metrics
- **Error tracking** with stack traces
- **Audit logging** for compliance

### Metrics
- **Request duration** tracking
- **Error rate** monitoring
- **Database connection** health
- **Memory usage** monitoring

## 🔒 Security Best Practices

### Authentication
- JWT tokens with short expiration (1 hour)
- Secure password requirements (12+ characters)
- bcrypt hashing with 12 rounds
- Failed login attempt tracking

### Authorization
- Role-based access control
- Resource-level permissions
- API endpoint protection
- Audit trail for all actions

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration

### Infrastructure
- Secrets management with AWS Secrets Manager
- Network security with VPC
- Database encryption at rest
- SSL/TLS for all communications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/api/docs`
- Review the health check endpoints
- Check application logs for errors

---

**Built with ❤️ using NestJS, TypeScript, and AWS**
