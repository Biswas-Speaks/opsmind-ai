import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import assetRoutes from './routes/asset.routes';
import metadataRoutes from './routes/metadata.routes';
import ticketRoutes from './routes/ticket.routes';
import infrastructureRoutes from './routes/infrastructure.routes';
import reportsRoutes from './routes/reports.routes';
import auditRoutes from './routes/audit.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import knowledgeRoutes from './routes/knowledge.routes';
import { errorHandler } from './middleware/error';
import { AppError } from './utils/errors';

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Compression middleware
app.use(compression());

// Development logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'Healthy',
      timestamp: new Date(),
    },
  });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/metadata', metadataRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/infrastructure', infrastructureRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/audit-logs', auditRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/knowledge', knowledgeRoutes);

// Catch all unregistered routes and return 404
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404, 'ROUTE_NOT_FOUND'));
});

// Global error handling middleware
app.use(errorHandler);

export default app;
