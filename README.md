# VantagePoint CRM

A modern CRM system built with Next.js and NestJS for healthcare provider management.

## Project Structure

```
├── frontend-nextjs/    # Next.js 15 frontend application
├── backend-nestjs/     # NestJS REST API backend
├── infrastructure/     # AWS CDK infrastructure code
└── docs/              # Project documentation
```

## Features

- **Healthcare Provider Management**: Comprehensive CRM for medical practices
- **Lead Tracking**: Track and convert potential clients
- **Hiring Module**: Manage recruitment and onboarding
- **Analytics Dashboard**: Real-time metrics and insights
- **Secure Authentication**: JWT-based auth with role-based access control

## Tech Stack

### Frontend
- Next.js 15.5.4
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui components

### Backend
- NestJS
- PostgreSQL with TypeORM
- JWT Authentication
- Redis for caching
- AWS deployment ready

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Redis (optional, for caching)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Backend
   cd backend-nestjs
   npm install
   
   # Frontend
   cd ../frontend-nextjs
   npm install
   ```

3. Set up environment variables (see `.env.example` in each directory)

4. Run the applications:
   ```bash
   # Backend
   cd backend-nestjs
   npm run start:dev
   
   # Frontend
   cd frontend-nextjs
   npm run dev
   ```

## Deployment

The application is designed for AWS deployment:
- Frontend: AWS Amplify
- Backend: AWS Elastic Beanstalk
- Database: AWS RDS PostgreSQL
- Infrastructure: AWS CDK

See the deployment guides in the `docs/` directory for detailed instructions.

## License

Private and confidential.