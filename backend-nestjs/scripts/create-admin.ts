import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { User, UserRole } from '../src/users/entities/user.entity';

// Load environment variables
config();

async function createAdminUser() {
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

    const userRepository = dataSource.getRepository(User);

    // Check if admin user already exists
    const existingAdmin = await userRepository.findOne({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('📧 Username: admin');
      console.log('🔑 Password: VantagePoint2024!');
      console.log('📧 Email: admin@vantagepointcrm.com');
      console.log('👤 Role: ADMIN (Full System Access)');
      return;
    }

    // Create the master admin user
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash('VantagePoint2024!', saltRounds);

    const adminUser = userRepository.create({
      username: 'admin',
      password_hash: passwordHash,
      email: 'admin@vantagepointcrm.com',
      full_name: 'System Administrator',
      role: UserRole.ADMIN,
      is_active: true,
      manager_id: null,
    });

    await userRepository.save(adminUser);

    console.log('✅ Master admin user created successfully!');
    console.log('');
    console.log('🔐 LOGIN CREDENTIALS:');
    console.log('📧 Username: admin');
    console.log('🔑 Password: VantagePoint2024!');
    console.log('📧 Email: admin@vantagepointcrm.com');
    console.log('👤 Role: ADMIN (Full System Access)');
    console.log('');
    console.log('🚨 IMPORTANT: Change this password after first login!');
    console.log('');
    console.log('🌐 You can now login at: http://localhost:3000');

    await dataSource.destroy();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
