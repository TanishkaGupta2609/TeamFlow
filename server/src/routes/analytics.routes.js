import { Router } from 'express';
import { requireAuth, requireWorkspaceRole } from '../middleware/auth.js';
import { getWorkspaceAnalytics } from '../controllers/analytics.controller.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get(
  '/',
  requireWorkspaceRole('MEMBER'),
  getWorkspaceAnalytics
);

export default router;
