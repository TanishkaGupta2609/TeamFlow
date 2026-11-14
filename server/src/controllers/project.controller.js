import { ProjectService } from '../services/project.service.js';
import { asyncHandler, sendSuccess, sendPaginated, getPagination } from '../utils/index.js';

/**
 * @desc    Create a new project
 * @route   POST /api/workspaces/:workspaceId/projects
 * @access  Protected (MANAGER)
 */
export const createProject = asyncHandler(async (req, res) => {
  const project = await ProjectService.createProject(req.workspaceId, req.user._id, req.body);
  return sendSuccess(res, project, 'Project created successfully', 201);
});

/**
 * @desc    List projects in workspace with filtering & metrics
 * @route   GET /api/workspaces/:workspaceId/projects
 * @access  Protected (MEMBER)
 */
export const getProjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status, priority, search, sort } = req.query;

  const { projects, total } = await ProjectService.getWorkspaceProjects(req.workspaceId, {
    status,
    priority,
    search,
    skip,
    limit,
    sort,
  });

  return sendPaginated(res, projects, { page, limit, total }, 'Projects retrieved successfully');
});

/**
 * @desc    Get project details with task metrics
 * @route   GET /api/workspaces/:workspaceId/projects/:projectId
 * @access  Protected (MEMBER)
 */
export const getProject = asyncHandler(async (req, res) => {
  const result = await ProjectService.getProjectDetails(req.workspaceId, req.params.projectId);
  return sendSuccess(res, result, 'Project details retrieved');
});

/**
 * @desc    Update project details
 * @route   PATCH /api/workspaces/:workspaceId/projects/:projectId
 * @access  Protected (MANAGER)
 */
export const updateProject = asyncHandler(async (req, res) => {
  const updated = await ProjectService.updateProject(
    req.workspaceId,
    req.params.projectId,
    req.user._id,
    req.body
  );
  return sendSuccess(res, updated, 'Project updated successfully');
});

/**
 * @desc    Archive project
 * @route   PATCH /api/workspaces/:workspaceId/projects/:projectId/archive
 * @access  Protected (MANAGER)
 */
export const archiveProject = asyncHandler(async (req, res) => {
  const archived = await ProjectService.archiveProject(
    req.workspaceId,
    req.params.projectId,
    req.user._id
  );
  return sendSuccess(res, archived, 'Project archived successfully');
});

/**
 * @desc    Delete project (Owner or Admin)
 * @route   DELETE /api/workspaces/:workspaceId/projects/:projectId
 * @access  Protected (ADMIN)
 */
export const deleteProject = asyncHandler(async (req, res) => {
  await ProjectService.deleteProject(req.workspaceId, req.params.projectId, req.user._id);
  return sendSuccess(res, {}, 'Project deleted successfully');
});
