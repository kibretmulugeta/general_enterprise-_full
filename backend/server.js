const app = require('./app');
const connectDB = require('./config/db');
const seedDatabase = require('./utils/seeder');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// Start HTTP Server after connecting to MongoDB and seeding initial data
const startServer = async () => {
  try {
    await connectDB();
    await seedDatabase();

    const server = app.listen(PORT, () => {
      logger.info(`==================================================`);
      logger.info(`🚀 ${process.env.APP_NAME || 'Enterprise Auth Framework'}`);
      logger.info(`🌐 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      logger.info(`🔗 Base URL: ${process.env.APP_URL || `http://localhost:${PORT}`}`);
      logger.info(`==================================================`);
    });

    // Unhandled Rejection & Uncaught Exception handlers
    process.on('unhandledRejection', (err) => {
      logger.error(`[Unhandled Rejection] ${err.message}`, { stack: err.stack });
    });

    process.on('uncaughtException', (err) => {
      logger.error(`[Uncaught Exception] ${err.message}`, { stack: err.stack });
      process.exit(1);
    });

    return server;
  } catch (error) {
    logger.error(`[Server Exception] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
