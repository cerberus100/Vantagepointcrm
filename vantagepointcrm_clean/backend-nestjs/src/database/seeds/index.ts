import { DataSource } from 'typeorm';
import { CreateAdminUserSeed } from './create-admin-user.seed';

export class SeedRunner {
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async runAllSeeds(): Promise<void> {
    console.log('🌱 Starting database seeding...');
    
    try {
      // Create admin user
      const adminSeed = new CreateAdminUserSeed();
      await adminSeed.run(this.dataSource);
      
      console.log('✅ All seeds completed successfully!');
    } catch (error) {
      console.error('❌ Error running seeds:', error);
      throw error;
    }
  }
}
