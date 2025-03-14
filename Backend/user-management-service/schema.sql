-- Users Table
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS user_addresses (
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
CREATE TABLE IF NOT EXISTS user_notification_preferences (
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