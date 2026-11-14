import { Router } from 'express';
import { requireAuth, requireWorkspaceRole } from '../middleware/auth.js';
import { getCalendarEvents } from '../controllers/calendar.controller.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get(
  '/',
  requireWorkspaceRole('MEMBER'),
  getCalendarEvents
);

export default router;
