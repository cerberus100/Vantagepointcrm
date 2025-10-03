import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { SeedRunner } from '../src/database/seeds';

// Load environment variables
config();

async function runSeeds() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: process.env.DATABASE_NAME || 'vantagepointcrm',
    entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('📊 Database connection established');

    const seedRunner = new SeedRunner(dataSource);
    await seedRunner.runAllSeeds();

    await dataSource.destroy();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeeds();
