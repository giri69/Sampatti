const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

let pool;

const getPool = () => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // Log pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  
  return pool;
};

/**
 * Execute a query with optional parameters
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} - Query result
 */
const query = async (text, params) => {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

/**
 * Execute a transaction with multiple queries
 * @param {Function} callback - Function that takes a client and executes queries
 * @returns {Promise<any>} - Result from callback
 */
const transaction = async (callback) => {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  query,
  transaction,
  getPool
};