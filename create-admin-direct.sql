-- Create schema
CREATE SCHEMA IF NOT EXISTS vantagepoint;

-- Create users table
CREATE TABLE IF NOT EXISTS vantagepoint.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'agent',
    is_active BOOLEAN DEFAULT true,
    manager_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert admin user with password VantagePoint2024!
INSERT INTO vantagepoint.users (username, password_hash, email, full_name, role, is_active)
VALUES (
    'admin',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K',
    'admin@vantagepointcrm.com',
    'System Administrator',
    'admin',
    true
) ON CONFLICT (username) DO NOTHING;

SELECT 'Admin user created successfully!' as result;
