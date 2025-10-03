# 🔐 VantagePoint CRM - Admin Credentials

## Master Admin Account

Since we purged all data and started fresh, you need to create the initial admin user.

### Default Admin Credentials

**Username:** `admin`  
**Password:** `VantagePoint2024!`  
**Email:** `admin@vantagepointcrm.com`  
**Role:** `ADMIN` (Full System Access)

---

## How to Create the Admin User

### Option 1: Using the API Endpoint (Recommended)

Once the backend is running, call the setup endpoint:

```bash
curl -X POST http://localhost:3001/api/v1/setup/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "VantagePoint2024!",
    "email": "admin@vantagepointcrm.com"
  }'
```

### Option 2: Using the Script

```bash
cd backend-nestjs
npm run create:admin
```

---

## Database Setup

We migrated from DynamoDB to **PostgreSQL** for cost savings and better performance.

### Database Configuration

- **Type:** PostgreSQL 13+
- **Database Name:** `vantagepointcrm`
- **Schema:** `vantagepoint`
- **Host:** localhost (development) or RDS (production)
- **Port:** 5432

### Tables Created

1. **users** - User accounts with roles (admin, manager, agent, hiring_team)
2. **leads** - Lead management
3. **audit_logs** - Comprehensive audit trail
4. **hiring_invites** - Hiring system invitations
5. **signatures** - Document signatures (W-9, BAA)
6. **payment_documents** - ACH/payment uploads
7. **training** - Compliance training records

---

## First Login Steps

1. **Start the backend:**
   ```bash
   cd backend-nestjs
   npm run start:dev
   ```

2. **Start the frontend:**
   ```bash
   cd frontend-nextjs
   npm run dev
   ```

3. **Access the CRM:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api/v1
   - API Docs: http://localhost:3001/api/v1/docs

4. **Login with admin credentials**

5. **IMPORTANT: Change the password immediately after first login!**

---

## User Roles

### ADMIN (Full Access)
- Create/manage all users
- Access all leads
- View all analytics
- Manage hiring system
- Full system configuration

### MANAGER
- Create/manage agents
- Access team leads
- View team analytics
- Assign leads to agents

### AGENT
- Create and manage assigned leads
- View own performance metrics
- Update lead status

### HIRING_TEAM
- Send hiring invitations
- Bulk upload new hires (CSV/Excel)
- Track onboarding progress
- Resend/revoke invitations

---

## Security Notes

🚨 **CRITICAL:**
- Change the default password immediately
- Enable MFA for admin accounts
- Use strong, unique passwords (12+ characters)
- Never share admin credentials
- Rotate passwords every 90 days
- Monitor audit logs regularly

---

## Troubleshooting

### Backend Won't Start

1. Check PostgreSQL is running:
   ```bash
   psql -U postgres -d vantagepointcrm -c "SELECT 1;"
   ```

2. Check Redis is running:
   ```bash
   redis-cli ping
   ```

3. Verify environment variables in `.env` file

### Can't Create Admin User

- Make sure database exists: `createdb vantagepointcrm`
- Run migrations: `npm run migration:run`
- Check database connection in `.env`

---

## Support

For issues or questions, check:
- `backend-nestjs/README.md` - Backend documentation
- `frontend-nextjs/README.md` - Frontend documentation
- `DEPLOYMENT_READY_SUMMARY.md` - Full system overview
