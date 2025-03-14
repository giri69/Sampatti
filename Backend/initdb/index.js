const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Add middleware to parse JSON
app.use(express.json());

// SQL schema for database initialization
const schema = `
-- Drop existing tables if they exist (useful for resetting)
DROP TABLE IF EXISTS user_notification_preferences;
DROP TABLE IF EXISTS user_addresses;
DROP TABLE IF EXISTS users;

-- Drop the update_timestamp function if it exists
DROP FUNCTION IF EXISTS update_timestamp();

-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone_number VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  recovery_words_hash VARCHAR(255) NOT NULL,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  identity_verified BOOLEAN DEFAULT FALSE,
  date_of_birth DATE,
  recovery_email VARCHAR(255),
  language VARCHAR(10) DEFAULT 'en',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  last_login TIMESTAMP,
  last_activity TIMESTAMP,
  login_attempts INTEGER DEFAULT 0,
  account_locked BOOLEAN DEFAULT FALSE,
  lock_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Address Table
CREATE TABLE user_addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  street VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Notification Preferences
CREATE TABLE user_notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT TRUE,
  asset_updates BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatically updating timestamps
CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_user_addresses_timestamp
BEFORE UPDATE ON user_addresses
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_user_notification_preferences_timestamp
BEFORE UPDATE ON user_notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Add an admin user (optional)
INSERT INTO users (
  first_name, 
  last_name, 
  email, 
  phone_number, 
  password, 
  recovery_words_hash,
  role,
  status
) VALUES (
  'Admin', 
  'User', 
  'admin@example.com', 
  '0000000000', 
  -- Password: admin123 (hashed)
  '$2a$10$lS44IxQlVsB7Tm1ZTNvgJeNHvE/vTFu9l/hBP0WPr9w52lKp8UzNG', 
  -- Recovery words hash (dummy value)
  '$2a$10$lS44IxQlVsB7Tm1ZTNvgJeNHvE/vTFu9l/hBP0WPr9w52lKp8UzNG',
  'admin',
  'active'
);

-- Add default notification preferences for admin
INSERT INTO user_notification_preferences (
  user_id, 
  email_notifications, 
  sms_notifications, 
  asset_updates
) VALUES (
  1, 
  TRUE, 
  TRUE, 
  TRUE
);
`;

// Function to create a database pool with retry mechanism
const createDbPool = () => {
  console.log('Creating database connection pool...');
  console.log(`Connection string: ${process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);
  
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000, // Increased timeout
  });
};

// Handle both GET and POST for init-db
app.all('/init-db', async (req, res) => {
  let pool;
  let client;
  
  try {
    console.log('Attempting to connect to database...');
    pool = createDbPool();
    
    console.log('Acquiring database client...');
    client = await pool.connect();
    
    console.log('Client acquired, initializing database schema...');
    await client.query(schema);
    
    console.log('Database initialization successful!');
    res.status(200).json({
      success: true,
      message: 'Database initialized successfully'
    });
  } catch (error) {
    console.error('Error during database initialization:', error);
    
    res.status(500).json({
      success: false,
      message: 'Database initialization failed',
      errorType: error.name,
      errorMessage: error.message,
      connectionString: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@') : 
        'Not provided'
    });
  } finally {
    if (client) {
      console.log('Releasing database client...');
      client.release();
    }
    if (pool) {
      console.log('Ending database pool...');
      await pool.end();
    }
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  let pool;
  let client;
  
  try {
    pool = createDbPool();
    client = await pool.connect();
    
    const result = await client.query('SELECT NOW()');
    
    res.status(200).json({
      status: 'healthy',
      timestamp: result.rows[0].now,
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    res.status(500).json({
      status: 'unhealthy',
      message: 'Database connection failed',
      error: error.message,
      connectionDetails: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@') : 
        'Not provided'
    });
  } finally {
    if (client) client.release();
    if (pool) await pool.end();
  }
});

// Show environment variables for debugging (don't use in production)
app.get('/check-config', (req, res) => {
  res.status(200).json({
    databaseUrl: process.env.DATABASE_URL ? 
      process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@') : 
      'Not provided',
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`- To initialize database: GET or POST to http://localhost:${PORT}/init-db`);
  console.log(`- To check health: GET http://localhost:${PORT}/health`);
  console.log(`- To check configuration: GET http://localhost:${PORT}/check-config`);
});