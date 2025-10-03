# 📋 **LEAD CREATION API GUIDE**

## **🎯 FOR FRONTEND DEVELOPERS**

This guide provides everything you need to implement lead creation in the frontend.

---

## **🔗 API ENDPOINT**

```
POST /api/v1/leads
```

**Base URL**: `http://localhost:3000` (development)  
**Production URL**: `https://your-domain.com`

---

## **🔐 AUTHENTICATION**

### **Required Headers**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### **How to Get JWT Token**
```javascript
// Login first to get JWT token
const loginResponse = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'agent_username',
    password: 'agent_password'
  })
});

const loginData = await loginResponse.json();
const jwtToken = loginData.data.access_token;
```

---

## **📝 REQUEST BODY**

### **Minimum Required**
```json
{
  "practice_name": "Advanced Cardiology Center"
}
```

### **Complete Example**
```json
{
  "practice_name": "Advanced Cardiology Center",
  "npi": "1234567890",
  "phone": "(555) 123-4567",
  "email": "info@cardiology.com",
  "state": "CA",
  "city": "Los Angeles",
  "address": "123 Medical Drive",
  "score": 85,
  "status": "new",
  "priority": "medium",
  "lead_type": "medicare",
  "assigned_user_id": 3
}
```

---

## **📊 FIELD SPECIFICATIONS**

| **Field** | **Type** | **Required** | **Validation** | **Example** |
|---|---|---|---|---|
| `practice_name` | string | ✅ Yes | 3-255 chars | "Advanced Cardiology Center" |
| `npi` | string | ❌ No | 10 digits | "1234567890" |
| `phone` | string | ❌ No | (XXX) XXX-XXXX | "(555) 123-4567" |
| `email` | string | ❌ No | Valid email | "info@cardiology.com" |
| `state` | string | ❌ No | 2 chars | "CA" |
| `city` | string | ❌ No | Max 100 chars | "Los Angeles" |
| `address` | string | ❌ No | Max 255 chars | "123 Medical Drive" |
| `score` | number | ❌ No | 0-100 | 85 |
| `status` | string | ❌ No | Enum | "new" |
| `priority` | string | ❌ No | Enum | "medium" |
| `lead_type` | string | ❌ No | Enum | "medicare" |
| `assigned_user_id` | number | ❌ No | Integer | 3 |

---

## **🎯 ENUM VALUES**

### **Status Options**
```javascript
const LEAD_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  PROPOSAL_SENT: 'proposal_sent',
  CLOSED_WON: 'closed_won',
  CLOSED_LOST: 'closed_lost',
  ON_HOLD: 'on_hold',
  INACTIVE: 'inactive'
};
```

### **Priority Options**
```javascript
const LEAD_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};
```

### **Lead Type Options**
```javascript
const LEAD_TYPE = {
  MEDICARE: 'medicare',
  RURAL: 'rural',
  ALLOGRAFT: 'allograft',
  GENERAL: 'general'
};
```

---

## **✅ SUCCESS RESPONSE**

### **HTTP Status**: `201 Created`

```json
{
  "success": true,
  "data": {
    "id": 1,
    "practice_name": "Advanced Cardiology Center",
    "npi": "1234567890",
    "phone": "(555) 123-4567",
    "email": "info@cardiology.com",
    "state": "CA",
    "city": "Los Angeles",
    "address": "123 Medical Drive",
    "score": 85,
    "status": "new",
    "priority": "medium",
    "lead_type": "medicare",
    "assigned_user_id": 3,
    "created_at": "2024-10-03T11:30:00.000Z",
    "updated_at": "2024-10-03T11:30:00.000Z"
  },
  "timestamp": "2024-10-03T11:30:00.000Z",
  "path": "/api/v1/leads"
}
```

---

## **❌ ERROR RESPONSES**

### **400 Bad Request - Validation Error**
```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": [
      "practice_name should not be empty",
      "npi must be exactly 10 digits"
    ],
    "error": "Bad Request",
    "timestamp": "2024-10-03T11:30:00.000Z",
    "path": "/api/v1/leads"
  }
}
```

### **401 Unauthorized - Missing/Invalid Token**
```json
{
  "success": false,
  "error": {
    "statusCode": 401,
    "message": "Unauthorized",
    "error": "Unauthorized",
    "timestamp": "2024-10-03T11:30:00.000Z",
    "path": "/api/v1/leads"
  }
}
```

### **403 Forbidden - Insufficient Permissions**
```json
{
  "success": false,
  "error": {
    "statusCode": 403,
    "message": "Access denied. Required roles: admin, manager, agent",
    "error": "Forbidden",
    "timestamp": "2024-10-03T11:30:00.000Z",
    "path": "/api/v1/leads"
  }
}
```

---

## **💻 FRONTEND IMPLEMENTATION EXAMPLES**

### **React/JavaScript Example**
```javascript
import { useState } from 'react';

const CreateLeadForm = () => {
  const [formData, setFormData] = useState({
    practice_name: '',
    npi: '',
    phone: '',
    email: '',
    state: '',
    city: '',
    address: '',
    score: '',
    status: 'new',
    priority: 'medium',
    lead_type: 'general'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/v1/leads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message.join(', '));
      }

      const result = await response.json();
      console.log('Lead created successfully:', result.data);
      
      // Reset form or redirect
      setFormData({
        practice_name: '',
        npi: '',
        phone: '',
        email: '',
        state: '',
        city: '',
        address: '',
        score: '',
        status: 'new',
        priority: 'medium',
        lead_type: 'general'
      });
      
    } catch (error) {
      console.error('Error creating lead:', error.message);
      // Handle error (show toast, etc.)
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Practice Name *"
        value={formData.practice_name}
        onChange={(e) => setFormData({...formData, practice_name: e.target.value})}
        required
      />
      {/* Add other form fields */}
      <button type="submit">Create Lead</button>
    </form>
  );
};
```

### **Vue.js Example**
```javascript
export default {
  data() {
    return {
      formData: {
        practice_name: '',
        npi: '',
        phone: '',
        email: '',
        state: '',
        city: '',
        address: '',
        score: '',
        status: 'new',
        priority: 'medium',
        lead_type: 'general'
      }
    };
  },
  methods: {
    async createLead() {
      try {
        const response = await this.$http.post('/api/v1/leads', this.formData, {
          headers: {
            'Authorization': `Bearer ${this.$store.getters.jwtToken}`
          }
        });
        
        console.log('Lead created:', response.data.data);
        this.$router.push('/leads');
        
      } catch (error) {
        console.error('Error creating lead:', error.response.data);
      }
    }
  }
};
```

### **Angular Example**
```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  private apiUrl = '/api/v1/leads';

  constructor(private http: HttpClient) {}

  createLead(leadData: any) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(this.apiUrl, leadData, { headers });
  }
}
```

---

## **🧪 TESTING**

### **cURL Test**
```bash
curl -X POST http://localhost:3000/api/v1/leads \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "practice_name": "Test Cardiology Center",
    "npi": "9876543210",
    "phone": "(555) 987-6543",
    "email": "test@cardiology.com",
    "state": "NY",
    "city": "New York",
    "score": 75,
    "priority": "high",
    "lead_type": "medicare"
  }'
```

### **Postman Collection**
Import this into Postman:
```json
{
  "info": {
    "name": "VantagePoint CRM - Lead Creation",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Lead",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}",
            "type": "text"
          },
          {
            "key": "Content-Type",
            "value": "application/json",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"practice_name\": \"Test Practice\",\n  \"npi\": \"1234567890\",\n  \"phone\": \"(555) 123-4567\",\n  \"email\": \"test@practice.com\",\n  \"state\": \"CA\",\n  \"city\": \"Los Angeles\",\n  \"score\": 85,\n  \"priority\": \"medium\",\n  \"lead_type\": \"medicare\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/v1/leads",
          "host": ["{{base_url}}"],
          "path": ["api", "v1", "leads"]
        }
      }
    }
  ]
}
```

---

## **📚 ADDITIONAL RESOURCES**

### **Swagger Documentation**
- **URL**: `http://localhost:3000/api/docs`
- **Interactive Testing**: Available in Swagger UI
- **Schema Definitions**: Complete API documentation

### **Related Endpoints**
- `GET /api/v1/leads` - List all leads
- `GET /api/v1/leads/:id` - Get lead by ID
- `PATCH /api/v1/leads/:id` - Update lead
- `DELETE /api/v1/leads/:id` - Delete lead (Admin/Manager only)

---

## **✅ READY FOR IMPLEMENTATION**

The lead creation API is **fully functional** and ready for frontend integration:

- ✅ **Authentication**: JWT token required
- ✅ **Validation**: Complete input validation
- ✅ **Error Handling**: Proper error responses
- ✅ **Documentation**: Swagger UI available
- ✅ **Testing**: Ready for frontend testing

**Agents can create leads immediately upon frontend implementation!**

---

**Status**: 🟢 **READY FOR FRONTEND** ✅  
**API Endpoint**: `POST /api/v1/leads`  
**Authentication**: JWT Bearer Token  
**Documentation**: Swagger UI at `/api/docs`
