const mongoose = require('mongoose');
const dotenv = require('dotenv');

let cachedDb = null;

const connectDb = async () => {
  if (cachedDb) {
    return cachedDb;
  }
  
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  
  const db = await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
  });
  
  cachedDb = db.connection;
  return cachedDb;
};

module.exports = connectDb;
