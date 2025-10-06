-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS vantagepoint;

-- Create user table
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
);

-- Insert admin user (password is VantagePoint2024! hashed with bcrypt)
INSERT INTO vantagepoint.user (username, password_hash, email, full_name, role, is_active) 
VALUES (
    'admin', 
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', 
    'admin@vantagepointcrm.com', 
    'System Administrator', 
    'ADMIN', 
    true
) ON CONFLICT (username) DO NOTHING;
