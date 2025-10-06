const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  const client = new Client({
    host: 'vantagepoint-production.c6ds4c4qok1n.us-east-1.rds.amazonaws.com',
    port: 5432,
    user: 'postgres',
    password: 'VantagePoint2024!',
    database: 'vantagepointcrm',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Create schema
    await client.query('CREATE SCHEMA IF NOT EXISTS vantagepoint');
    console.log('Schema created');

    // Create user table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vantagepoint.user (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        full_name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'USER',
        is_active BOOLEAN DEFAULT true,
        manager_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table created');

    // Hash password
    const passwordHash = await bcrypt.hash('VantagePoint2024!', 12);
    console.log('Password hashed');

    // Insert admin user
    await client.query(`
      INSERT INTO vantagepoint.user (username, password_hash, email, full_name, role, is_active) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      ON CONFLICT (username) DO NOTHING
    `, ['admin', passwordHash, 'admin@vantagepointcrm.com', 'System Administrator', 'ADMIN', true]);
    
    console.log('Admin user created successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

setupDatabase();
