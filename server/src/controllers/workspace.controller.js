import { WorkspaceService } from '../services/workspace.service.js';
import { asyncHandler, sendSuccess, sendPaginated, getPagination, getSort } from '../utils/index.js';

/**
 * @desc    Create a new workspace
 * @route   POST /api/workspaces
 * @access  Protected
 */
export const createWorkspace = asyncHandler(async (req, res) => {
  // If req.user is not yet populated (before Stage 04 auth middleware), use fallback user ID from body or test ID
  const ownerId = req.user?._id || req.body.ownerId;
  if (!ownerId) {
    res.status(400);
    throw new Error('Workspace ownerId is required');
  }

  const workspace = await WorkspaceService.createWorkspace(ownerId, req.body);
  return sendSuccess(res, workspace, 'Workspace created successfully', 201);
});

/**
 * @desc    Get workspace details by slug
 * @route   GET /api/workspaces/:slug
 * @access  Public / Protected
 */
export const getWorkspace = asyncHandler(async (req, res) => {
  const workspace = await WorkspaceService.getWorkspaceBySlug(req.params.slug);
  return sendSuccess(res, workspace, 'Workspace retrieved successfully');
});

/**
 * @desc    List workspaces with pagination & filtering
 * @route   GET /api/workspaces
 * @access  Public / Protected
 */
export const listWorkspaces = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const sort = getSort(req.query);

  const { workspaces, total } = await WorkspaceService.listWorkspaces({
    skip,
    limit,
    sort,
  });

  return sendPaginated(res, workspaces, { page, limit, total }, 'Workspaces retrieved successfully');
});
