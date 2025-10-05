import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'vantagepoint-production.c6ds4c4qok1n.us-east-1.rds.amazonaws.com',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'VantagePoint2024!',
  name: process.env.DATABASE_NAME || 'vantagepointcrm',
  schema: 'vantagepoint',
  ssl: process.env.NODE_ENV === 'production' || true, // Always use SSL for AWS RDS
  logging: process.env.NODE_ENV === 'development',
  synchronize: process.env.NODE_ENV === 'development' || true, // Allow sync for initial setup
}));
