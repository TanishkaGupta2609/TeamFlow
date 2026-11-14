import { WorkspaceService } from '../services/workspace.service.js';
import { asyncHandler, sendSuccess } from '../utils/index.js';

/**
 * @desc    Create a new workspace
 * @route   POST /api/workspaces
 * @access  Protected
 */
export const createWorkspace = asyncHandler(async (req, res) => {
  const workspace = await WorkspaceService.createWorkspace(req.user._id, req.body);
  return sendSuccess(res, workspace, 'Workspace created successfully', 201);
});

/**
 * @desc    Get all workspaces where user is an active member
 * @route   GET /api/workspaces
 * @access  Protected
 */
export const getUserWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await WorkspaceService.getUserWorkspaces(req.user._id);
  return sendSuccess(res, workspaces, 'Workspaces retrieved successfully');
});

/**
 * @desc    Get workspace details by ID or slug
 * @route   GET /api/workspaces/:workspaceId
 * @access  Protected
 */
export const getWorkspace = asyncHandler(async (req, res) => {
  const workspaceId = req.params.workspaceId;
  const result = await WorkspaceService.getWorkspaceById(workspaceId, req.user._id);
  return sendSuccess(res, result, 'Workspace details retrieved');
});

/**
 * @desc    Update workspace details
 * @route   PATCH /api/workspaces/:workspaceId
 * @access  Protected (ADMIN)
 */
export const updateWorkspace = asyncHandler(async (req, res) => {
  const updated = await WorkspaceService.updateWorkspace(req.params.workspaceId, req.body);
  return sendSuccess(res, updated, 'Workspace updated successfully');
});

/**
 * @desc    Delete workspace (Owner Only)
 * @route   DELETE /api/workspaces/:workspaceId
 * @access  Protected (Owner)
 */
export const deleteWorkspace = asyncHandler(async (req, res) => {
  await WorkspaceService.deleteWorkspace(req.params.workspaceId, req.user._id);
  return sendSuccess(res, {}, 'Workspace deleted successfully');
});

/**
 * @desc    Get all members of a workspace
 * @route   GET /api/workspaces/:workspaceId/members
 * @access  Protected (MEMBER)
 */
export const getMembers = asyncHandler(async (req, res) => {
  const members = await WorkspaceService.getWorkspaceMembers(req.params.workspaceId);
  return sendSuccess(res, members, 'Workspace members retrieved');
});

/**
 * @desc    Update a workspace member's role
 * @route   PATCH /api/workspaces/:workspaceId/members/:memberId/role
 * @access  Protected (ADMIN)
 */
export const updateMemberRole = asyncHandler(async (req, res) => {
  const updated = await WorkspaceService.updateMemberRole(
    req.params.workspaceId,
    req.params.memberId,
    req.body.role,
    req.user._id
  );
  return sendSuccess(res, updated, 'Member role updated successfully');
});

/**
 * @desc    Update a workspace member's status (ACTIVE / SUSPENDED)
 * @route   PATCH /api/workspaces/:workspaceId/members/:memberId/status
 * @access  Protected (ADMIN)
 */
export const updateMemberStatus = asyncHandler(async (req, res) => {
  const updated = await WorkspaceService.updateMemberStatus(
    req.params.workspaceId,
    req.params.memberId,
    req.body.status,
    req.user._id
  );
  return sendSuccess(res, updated, 'Member status updated successfully');
});

/**
 * @desc    Remove a member from a workspace
 * @route   DELETE /api/workspaces/:workspaceId/members/:memberId
 * @access  Protected (ADMIN)
 */
export const removeMember = asyncHandler(async (req, res) => {
  await WorkspaceService.removeMember(req.params.workspaceId, req.params.memberId, req.user._id);
  return sendSuccess(res, {}, 'Member removed from workspace');
});

/**
 * @desc    Invite a member to a workspace by email
 * @route   POST /api/workspaces/:workspaceId/invitations
 * @access  Protected (MANAGER)
 */
export const inviteMember = asyncHandler(async (req, res) => {
  const result = await WorkspaceService.inviteMember(req.params.workspaceId, req.user._id, req.body);
  return sendSuccess(res, result, 'Invitation sent successfully', 201);
});

/**
 * @desc    Get pending invitations for a workspace
 * @route   GET /api/workspaces/:workspaceId/invitations
 * @access  Protected (MANAGER)
 */
export const getInvitations = asyncHandler(async (req, res) => {
  const invitations = await WorkspaceService.getWorkspaceInvitations(req.params.workspaceId);
  return sendSuccess(res, invitations, 'Pending invitations retrieved');
});

/**
 * @desc    Resend a pending invitation
 * @route   POST /api/workspaces/:workspaceId/invitations/:invitationId/resend
 * @access  Protected (MANAGER)
 */
export const resendInvitation = asyncHandler(async (req, res) => {
  const result = await WorkspaceService.resendInvitation(
    req.params.workspaceId,
    req.params.invitationId
  );
  return sendSuccess(res, result, 'Invitation resent successfully');
});

/**
 * @desc    Revoke an invitation
 * @route   DELETE /api/workspaces/:workspaceId/invitations/:invitationId
 * @access  Protected (MANAGER)
 */
export const revokeInvitation = asyncHandler(async (req, res) => {
  await WorkspaceService.revokeInvitation(req.params.workspaceId, req.params.invitationId);
  return sendSuccess(res, {}, 'Invitation revoked');
});

/**
 * @desc    Public preview of invitation details
 * @route   GET /api/workspaces/invitations/:token
 * @access  Public
 */
export const getInvitationDetails = asyncHandler(async (req, res) => {
  const invitation = await WorkspaceService.getInvitationByToken(req.params.token);
  return sendSuccess(res, invitation, 'Invitation details verified');
});

/**
 * @desc    Accept invitation and join workspace
 * @route   POST /api/workspaces/invitations/:token/accept
 * @access  Protected
 */
export const acceptInvitation = asyncHandler(async (req, res) => {
  const result = await WorkspaceService.acceptInvitation(req.params.token, req.user);
  return sendSuccess(res, result, 'Invitation accepted! You have joined the workspace.');
});

/**
 * @desc    Reject invitation
 * @route   POST /api/workspaces/invitations/:token/reject
 * @access  Public
 */
export const rejectInvitation = asyncHandler(async (req, res) => {
  await WorkspaceService.rejectInvitation(req.params.token);
  return sendSuccess(res, {}, 'Invitation declined');
});
