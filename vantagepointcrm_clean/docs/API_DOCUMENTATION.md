# VantagePoint CRM API Documentation

## 🌐 Base URL
```
Production: https://api.vantagepointcrm.com
```

## 🔐 Authentication

All protected endpoints require JWT authentication in the header:
```bash
Authorization: Bearer <jwt_token>
```

### **Get JWT Token:**
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin", 
    "role": "admin"
  }
}
```

## 👤 User Management

### **Get Current User**
```bash
GET /api/v1/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "created_at": "2025-07-25T10:30:00Z"
}
```

### **Create New User**
```bash
POST /api/v1/users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "username": "newagent",
  "password": "password123",
  "role": "agent"
}
```

### **Get All Users** (Admin/Manager only)
```bash
GET /api/v1/users
Authorization: Bearer <token>
```

## 📊 Lead Management

### **Get Leads (Role-filtered)**
```bash
GET /api/v1/leads
Authorization: Bearer <token>

# Query parameters:
?status=new          # Filter by status
?assigned_to=3       # Filter by agent ID
?lead_type=medicare  # Filter by lead type
?limit=50           # Limit results
```

**Response:**
```json
{
  "leads": [
    {
      "id": 1,
      "practice_name": "Advanced Cardiology Center",
      "npi": "1234567890",
      "phone": "(555) 123-4567",
      "email": "info@cardiology.com",
      "state": "CA",
      "city": "Los Angeles", 
      "score": 85,
      "status": "new",
      "priority": "high",
      "assigned_to": 3,
      "lead_type": "medicare",
      "created_at": "2025-08-01T10:00:00Z"
    }
  ],
  "total": 1,
  "user_role": "admin"
}
```

### **Create New Lead**
```bash
POST /api/v1/leads
Authorization: Bearer <token>
Content-Type: application/json

{
  "practice_name": "New Medical Practice",
  "npi": "9876543210",
  "phone": "(555) 987-6543",
  "email": "contact@newpractice.com",
  "state": "TX",
  "city": "Dallas",
  "lead_type": "rural"
}
```

### **Update Lead**
```bash
PUT /api/v1/leads/{lead_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "contacted",
  "assigned_to": 5,
  "priority": "high"
}
```

### **Bulk Create Leads**
```bash
POST /api/v1/leads/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "leads": [
    {
      "practice_name": "Practice 1",
      "npi": "1111111111",
      "phone": "(555) 111-1111",
      "state": "NY",
      "lead_type": "medicare"
    },
    {
      "practice_name": "Practice 2", 
      "npi": "2222222222",
      "phone": "(555) 222-2222",
      "state": "FL",
      "lead_type": "rural"
    }
  ]
}
```

## 📈 Analytics & Reporting

### **Admin Analytics Dashboard**
```bash
GET /api/v1/admin/analytics
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "total_leads": 492,
  "leads_by_status": {
    "new": 123,
    "contacted": 89,
    "qualified": 156,
    "closed": 124
  },
  "leads_by_type": {
    "medicare": 234,
    "rural": 189,
    "allograft": 69
  },
  "leads_by_score_range": {
    "90-100": 45,
    "80-89": 156,
    "70-79": 178,
    "60-69": 89,
    "below_60": 24
  },
  "agent_distribution": [
    {
      "agent_id": 3,
      "agent_name": "Agent1", 
      "assigned_leads": 87,
      "status_breakdown": {
        "new": 12,
        "contacted": 45,
        "qualified": 20,
        "closed": 10
      }
    }
  ]
}
```

### **System Summary**
```bash
GET /api/v1/summary
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total_leads": 492,
  "active_users": 26,
  "leads_today": 15,
  "conversion_rate": "23.4%",
  "top_performing_agent": "Agent1",
  "system_health": "excellent"
}
```

## 🔍 Health & Status

### **API Health Check**
```bash
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-04T08:18:00Z",
  "version": "1.0.0",
  "database": "connected"
}
```

## 📋 Lead Status Values

### **Valid Status Options:**
- `new` - Newly imported lead
- `contacted` - Initial contact made
- `qualified` - Lead shows interest/potential
- `proposal_sent` - Proposal or quote sent
- `closed_won` - Successfully converted
- `closed_lost` - Lost to competitor or no interest
- `on_hold` - Temporarily paused
- `inactive` - Marked as inactive/duplicate

### **Valid Priority Options:**
- `low` - Low priority follow-up
- `medium` - Standard priority
- `high` - High priority, immediate attention
- `urgent` - Requires immediate action

### **Valid Lead Types:**
- `medicare` - Medicare-related opportunities
- `rural` - Rural healthcare providers
- `allograft` - Tissue/organ transplant related
- `general` - General healthcare leads

## 🚫 Error Responses

### **Common Error Codes:**
```json
{
  "error": "Authentication required",
  "code": 401,
  "message": "Valid JWT token required"
}

{
  "error": "Access denied", 
  "code": 403,
  "message": "Insufficient permissions for this operation"
}

{
  "error": "Resource not found",
  "code": 404, 
  "message": "Lead with ID 999 not found"
}

{
  "error": "Validation error",
  "code": 400,
  "message": "Invalid lead data: NPI must be 10 digits"
}

{
  "error": "Server error",
  "code": 500,
  "message": "Internal server error occurred"
}
```

## 🔧 Rate Limits

- **Authentication endpoints:** 10 requests/minute
- **Read operations:** 100 requests/minute  
- **Write operations:** 50 requests/minute
- **Bulk operations:** 5 requests/minute

## 📝 Request/Response Examples

### **Complete Lead Creation Example:**
```bash
curl -X POST https://api.vantagepointcrm.com/api/v1/leads \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "practice_name": "Downtown Medical Center",
    "npi": "1234567890",
    "phone": "(555) 123-4567",
    "email": "admin@downtownmed.com",
    "state": "CA",
    "city": "San Francisco",
    "address": "123 Medical Drive",
    "specialty": "Cardiology",
    "lead_type": "medicare",
    "source": "website_inquiry",
    "notes": "Expressed interest in Medicare Advantage plans"
  }'
```

---

**🎯 API Status: PRODUCTION READY**
*Base URL: https://api.vantagepointcrm.com*