import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../../users/entities/user.entity';

export class CreateAdminUserSeed {
  public async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);

    // Check if admin user already exists
    const existingAdmin = await userRepository.findOne({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
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
    console.log('📧 Username: admin');
    console.log('🔑 Password: VantagePoint2024!');
    console.log('📧 Email: admin@vantagepointcrm.com');
    console.log('👤 Role: ADMIN (Full System Access)');
    console.log('');
    console.log('🚨 IMPORTANT: Change this password after first login!');
  }
}
