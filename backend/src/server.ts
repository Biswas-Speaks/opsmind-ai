import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before importing other modules
dotenv.config();

import app from './app';
import { connectDB } from './config/db';
import { setupSocket } from './sockets';

const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Setup Socket.IO Server
setupSocket(server);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error(`Uncaught Exception Error: ${err.message}`);
  process.exit(1);
});
