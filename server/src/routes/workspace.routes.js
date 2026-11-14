import { Router } from 'express';
import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getMembers,
  updateMemberRole,
  updateMemberStatus,
  removeMember,
  inviteMember,
  getInvitations,
  resendInvitation,
  revokeInvitation,
  getInvitationDetails,
  acceptInvitation,
  rejectInvitation,
} from '../controllers/workspace.controller.js';
import { requireAuth, requireWorkspaceRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  updateMemberStatusSchema,
} from '../validators/workspace.validator.js';
import projectRoutes from './project.routes.js';
import taskRoutes from './task.routes.js';

const router = Router();

// ==========================================
// 1. Invitation Token Action Routes (Public & Semi-Public)
// ==========================================
router.get('/invitations/:token', getInvitationDetails);
router.post('/invitations/:token/accept', requireAuth, acceptInvitation);
router.post('/invitations/:token/reject', rejectInvitation);

// ==========================================
// 2. Base Workspace Routes
// ==========================================
router
  .route('/')
  .post(requireAuth, validate(createWorkspaceSchema), createWorkspace)
  .get(requireAuth, getUserWorkspaces);

// ==========================================
// 3. Specific Workspace Resource Routes
// ==========================================
router
  .route('/:workspaceId')
  .get(requireAuth, requireWorkspaceRole('MEMBER'), getWorkspace)
  .patch(requireAuth, requireWorkspaceRole('ADMIN'), validate(updateWorkspaceSchema), updateWorkspace)
  .delete(requireAuth, requireWorkspaceRole('ADMIN'), deleteWorkspace);

// ==========================================
// 4. Team & Member Management Routes
// ==========================================
router.get(
  '/:workspaceId/members',
  requireAuth,
  requireWorkspaceRole('MEMBER'),
  getMembers
);

router.patch(
  '/:workspaceId/members/:memberId/role',
  requireAuth,
  requireWorkspaceRole('ADMIN'),
  validate(updateMemberRoleSchema),
  updateMemberRole
);

router.patch(
  '/:workspaceId/members/:memberId/status',
  requireAuth,
  requireWorkspaceRole('ADMIN'),
  validate(updateMemberStatusSchema),
  updateMemberStatus
);

router.delete(
  '/:workspaceId/members/:memberId',
  requireAuth,
  requireWorkspaceRole('ADMIN'),
  removeMember
);

// ==========================================
// 5. Workspace Invitation Management Routes
// ==========================================
router
  .route('/:workspaceId/invitations')
  .post(requireAuth, requireWorkspaceRole('MANAGER'), validate(inviteMemberSchema), inviteMember)
  .get(requireAuth, requireWorkspaceRole('MANAGER'), getInvitations);

router.post(
  '/:workspaceId/invitations/:invitationId/resend',
  requireAuth,
  requireWorkspaceRole('MANAGER'),
  resendInvitation
);

router.delete(
  '/:workspaceId/invitations/:invitationId',
  requireAuth,
  requireWorkspaceRole('MANAGER'),
  revokeInvitation
);

// ==========================================
// 6. Projects & Tasks Sub-Routes
// ==========================================
router.use('/:workspaceId/projects', projectRoutes);
router.use('/:workspaceId/tasks', taskRoutes);

export default router;
