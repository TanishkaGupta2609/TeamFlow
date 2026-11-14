import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  archiveProject,
  deleteProject,
} from '../controllers/project.controller.js';
import { requireAuth, requireWorkspaceRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createProjectSchema,
  updateProjectSchema,
} from '../validators/project.validator.js';
import taskRoutes from './task.routes.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

// Nested task routes for this project
router.use('/:projectId/tasks', taskRoutes);

router
  .route('/')
  .post(requireWorkspaceRole('MANAGER'), validate(createProjectSchema), createProject)
  .get(requireWorkspaceRole('MEMBER'), getProjects);

router
  .route('/:projectId')
  .get(requireWorkspaceRole('MEMBER'), getProject)
  .patch(requireWorkspaceRole('MANAGER'), validate(updateProjectSchema), updateProject)
  .delete(requireWorkspaceRole('MANAGER'), deleteProject);

router.patch(
  '/:projectId/archive',
  requireWorkspaceRole('MANAGER'),
  archiveProject
);

export default router;
