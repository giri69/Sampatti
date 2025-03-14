const bcrypt = require('bcryptjs');
const db = require('./dbConnection');

/**
 * User model for PostgreSQL
 */
class User {
  /**
   * Create a new user
   * @param {Object} userData - User data to create
   * @returns {Promise<Object>} Created user object
   */
  static async create(userData) {
    return db.transaction(async (client) => {
      // Insert into users table
      const userQuery = `
        INSERT INTO users (
          first_name, last_name, email, phone_number, password, recovery_words_hash, 
          identity_verified, date_of_birth, recovery_email, language, status, role
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      const userParams = [
        userData.firstName,
        userData.lastName,
        userData.email.toLowerCase(),
        userData.phoneNumber,
        userData.password, // Will be hashed before calling this method
        userData.recoveryWordsHash,
        userData.identityVerified || false,
        userData.dateOfBirth || null,
        userData.recoveryEmail || null,
        userData.language || 'en',
        userData.status || 'active',
        userData.role || 'user'
      ];
      
      const userResult = await client.query(userQuery, userParams);
      const user = userResult.rows[0];
      
      // Insert address if provided
      if (userData.address) {
        const addressQuery = `
          INSERT INTO user_addresses (
            user_id, street, city, state, zip_code, country
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        
        const addressParams = [
          user.id,
          userData.address.street || null,
          userData.address.city || null,
          userData.address.state || null,
          userData.address.zipCode || null,
          userData.address.country || null
        ];
        
        const addressResult = await client.query(addressQuery, addressParams);
        user.address = addressResult.rows[0];
      }
      
      // Insert notification preferences if provided
      const notifQuery = `
        INSERT INTO user_notification_preferences (
          user_id, email_notifications, sms_notifications, asset_updates
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const prefs = userData.notificationPreferences || {};
      const notifParams = [
        user.id,
        prefs.email !== undefined ? prefs.email : true,
        prefs.sms !== undefined ? prefs.sms : true,
        prefs.assetUpdates !== undefined ? prefs.assetUpdates : true
      ];
      
      const notifResult = await client.query(notifQuery, notifParams);
      user.notificationPreferences = notifResult.rows[0];
      
      return user;
    });
  }
  
  /**
   * Find a single user by a field value
   * @param {string} field - The field to search by
   * @param {any} value - The value to search for
   * @returns {Promise<Object|null>} - User or null if not found
   */
  static async findOne(conditions) {
    const entries = Object.entries(conditions);
    if (entries.length === 0) return null;
    
    const [field, value] = entries[0]; // Only use the first condition for simplicity
    
    // Convert camelCase to snake_case for PostgreSQL
    const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
    
    const query = `
      SELECT u.*, 
        jsonb_build_object(
          'street', a.street,
          'city', a.city,
          'state', a.state,
          'zipCode', a.zip_code,
          'country', a.country
        ) as address,
        jsonb_build_object(
          'email', np.email_notifications,
          'sms', np.sms_notifications,
          'assetUpdates', np.asset_updates
        ) as notification_preferences
      FROM users u
      LEFT JOIN user_addresses a ON u.id = a.user_id
      LEFT JOIN user_notification_preferences np ON u.id = np.user_id
      WHERE u.${dbField} = $1
    `;
    
    const result = await db.query(query, [value]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapDbUserToModel(result.rows[0]);
  }
  
  /**
   * Find a user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} - User or null if not found
   */
  static async findById(id) {
    return this.findOne({ id });
  }
  
  /**
   * Find all users
   * @returns {Promise<Array>} - Array of users
   */
  static async find() {
    const query = `
      SELECT u.*, 
        jsonb_build_object(
          'street', a.street,
          'city', a.city,
          'state', a.state,
          'zipCode', a.zip_code,
          'country', a.country
        ) as address,
        jsonb_build_object(
          'email', np.email_notifications,
          'sms', np.sms_notifications,
          'assetUpdates', np.asset_updates
        ) as notification_preferences
      FROM users u
      LEFT JOIN user_addresses a ON u.id = a.user_id
      LEFT JOIN user_notification_preferences np ON u.id = np.user_id
    `;
    
    const result = await db.query(query);
    return result.rows.map(user => this.mapDbUserToModel(user));
  }
  
  /**
   * Update a user by ID
   * @param {number} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} - Updated user or null if not found
   */
  static async findByIdAndUpdate(id, updateData) {
    return db.transaction(async (client) => {
      // First check if user exists
      const checkQuery = 'SELECT id FROM users WHERE id = $1';
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        return null;
      }
      
      // Update user fields
      if (Object.keys(updateData).some(key => !['address', 'notificationPreferences'].includes(key))) {
        const userFields = [];
        const userValues = [];
        let paramIndex = 1;
        
        // Build dynamic update query
        for (const [key, value] of Object.entries(updateData)) {
          if (['address', 'notificationPreferences'].includes(key)) continue;
          
          // Convert camelCase to snake_case for PostgreSQL
          const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          userFields.push(`${dbField} = $${paramIndex}`);
          userValues.push(value);
          paramIndex++;
        }
        
        if (userFields.length > 0) {
          const userQuery = `
            UPDATE users 
            SET ${userFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
          `;
          userValues.push(id);
          await client.query(userQuery, userValues);
        }
      }
      
      // Update address if provided
      if (updateData.address) {
        const addressFields = [];
        const addressValues = [];
        let paramIndex = 1;
        
        for (const [key, value] of Object.entries(updateData.address)) {
          // Convert camelCase to snake_case for PostgreSQL
          const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          addressFields.push(`${dbField} = $${paramIndex}`);
          addressValues.push(value);
          paramIndex++;
        }
        
        if (addressFields.length > 0) {
          // Check if address exists
          const checkAddrQuery = 'SELECT id FROM user_addresses WHERE user_id = $1';
          const checkAddrResult = await client.query(checkAddrQuery, [id]);
          
          if (checkAddrResult.rows.length === 0) {
            // Insert new address
            const insertQuery = `
              INSERT INTO user_addresses (user_id, ${addressFields.map((_, i) => 
                Object.keys(updateData.address)[i].replace(/([A-Z])/g, '_$1').toLowerCase()
              ).join(', ')})
              VALUES ($${paramIndex}, ${addressValues.map((_, i) => `$${i + 1}`).join(', ')})
            `;
            addressValues.push(id);
            await client.query(insertQuery, addressValues);
          } else {
            // Update existing address
            const addressQuery = `
              UPDATE user_addresses 
              SET ${addressFields.join(', ')}
              WHERE user_id = $${paramIndex}
            `;
            addressValues.push(id);
            await client.query(addressQuery, addressValues);
          }
        }
      }
      
      // Update notification preferences if provided
      if (updateData.notificationPreferences) {
        const prefFields = [];
        const prefValues = [];
        let paramIndex = 1;
        
        for (const [key, value] of Object.entries(updateData.notificationPreferences)) {
          // Convert camelCase to snake_case for PostgreSQL
          const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          prefFields.push(`${dbField} = $${paramIndex}`);
          prefValues.push(value);
          paramIndex++;
        }
        
        if (prefFields.length > 0) {
          // Check if preferences exist
          const checkPrefQuery = 'SELECT id FROM user_notification_preferences WHERE user_id = $1';
          const checkPrefResult = await client.query(checkPrefQuery, [id]);
          
          if (checkPrefResult.rows.length === 0) {
            // Insert new preferences
            const insertQuery = `
              INSERT INTO user_notification_preferences (user_id, ${prefFields.map((_, i) => 
                Object.keys(updateData.notificationPreferences)[i].replace(/([A-Z])/g, '_$1').toLowerCase()
              ).join(', ')})
              VALUES ($${paramIndex}, ${prefValues.map((_, i) => `$${i + 1}`).join(', ')})
            `;
            prefValues.push(id);
            await client.query(insertQuery, prefValues);
          } else {
            // Update existing preferences
            const prefQuery = `
              UPDATE user_notification_preferences 
              SET ${prefFields.join(', ')}
              WHERE user_id = $${paramIndex}
            `;
            prefValues.push(id);
            await client.query(prefQuery, prefValues);
          }
        }
      }
      
      // Get the updated user
      return await this.findById(id);
    });
  }
  
  /**
   * Delete a user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} - Deleted user or null if not found
   */
  static async findByIdAndDelete(id) {
    // Get user before deleting
    const user = await this.findById(id);
    
    if (!user) {
      return null;
    }
    
    // Delete user (cascade will handle related records)
    const query = 'DELETE FROM users WHERE id = $1';
    await db.query(query, [id]);
    
    return user;
  }
  
  /**
   * Save changes to an existing user
   * @param {Object} user - User object with changes
   * @returns {Promise<Object>} - Updated user
   */
  static async save(user) {
    if (!user.id) {
      throw new Error('Cannot save user without ID');
    }
    
    return this.findByIdAndUpdate(user.id, user);
  }
  
  /**
   * Compare a plain text password with the hashed password
   * @param {string} plainPassword - Plain text password to compare
   * @param {string} hashedPassword - Hashed password from database
   * @returns {Promise<boolean>} - True if passwords match
   */
  static async comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
  
  /**
   * Map a database user object to our model format
   * @param {Object} dbUser - User object from database
   * @returns {Object} - Formatted user object
   */
  static mapDbUserToModel(dbUser) {
    if (!dbUser) return null;
    
    // Convert snake_case to camelCase
    const user = {
      id: dbUser.id,
      _id: dbUser.id.toString(), // For compatibility with MongoDB code
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      email: dbUser.email,
      phoneNumber: dbUser.phone_number,
      password: dbUser.password,
      recoveryWordsHash: dbUser.recovery_words_hash,
      passwordResetToken: dbUser.password_reset_token,
      passwordResetExpires: dbUser.password_reset_expires,
      identityVerified: dbUser.identity_verified,
      dateOfBirth: dbUser.date_of_birth,
      recoveryEmail: dbUser.recovery_email,
      address: dbUser.address,
      notificationPreferences: dbUser.notification_preferences,
      language: dbUser.language,
      status: dbUser.status,
      role: dbUser.role,
      lastLogin: dbUser.last_login,
      lastActivity: dbUser.last_activity,
      loginAttempts: dbUser.login_attempts,
      accountLocked: dbUser.account_locked,
      lockUntil: dbUser.lock_until,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at
    };
    
    // Add MongoDB-compatible methods
    user.toObject = function() {
      return { ...this };
    };
    
    user.comparePassword = async function(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    };
    
    return user;
  }
}

module.exports = User;