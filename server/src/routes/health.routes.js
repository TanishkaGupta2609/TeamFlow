import { Router } from 'express';
import { getDbStatus } from '../config/db.js';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    System health check endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  const dbStatus = getDbStatus();
  
  res.status(200).json({
    status: 'ok',
    app: 'TeamFlow API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(2)}s`,
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: {
        status: dbStatus,
        details: dbStatus === 'connected' ? 'MongoDB connection active' : 'MongoDB connection pending/disconnected'
      },
    },
  });
});

export default router;
