const mongoose = require('mongoose');

/**
 * Connect to MongoDB Database
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: true,
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[Database Error] Mongoose connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database Warning] Mongoose disconnected');
    });

    return conn;
  } catch (error) {
    console.error(`[Database Exception] Error connecting to MongoDB: ${error.message}`);
    // If not in test environment, exit on fatal DB connection error
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
