import http from 'http';
import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';

const startServer = async () => {
  // Connect to Database
  await connectDB();

  const server = http.createServer(app);

  server.listen(config.port, () => {
    console.log(`[TeamFlow Server] Running in ${config.nodeEnv} mode on http://localhost:${config.port}`);
    console.log(`[TeamFlow Server] Health check available at http://localhost:${config.port}/api/health`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`[Unhandled Rejection]: ${err.message}`);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error(`[Uncaught Exception]: ${err.message}`);
  });
};

startServer();
