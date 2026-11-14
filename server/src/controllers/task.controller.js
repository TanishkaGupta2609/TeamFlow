import { TaskService } from '../services/task.service.js';
import { asyncHandler, sendSuccess, sendPaginated, getPagination } from '../utils/index.js';

/**
 * @desc    Create a new task
 * @route   POST /api/workspaces/:workspaceId/tasks
 * @access  Protected (MEMBER)
 */
export const createTask = asyncHandler(async (req, res) => {
  const projectId = req.body.projectId || req.params.projectId;
  if (!projectId) {
    const error = new Error('Project ID is required to create a task');
    error.statusCode = 400;
    throw error;
  }

  const task = await TaskService.createTask(req.workspaceId, projectId, req.user._id, req.body);
  return sendSuccess(res, task, 'Task created successfully', 201);
});

/**
 * @desc    List tasks in workspace with filters
 * @route   GET /api/workspaces/:workspaceId/tasks
 * @access  Protected (MEMBER)
 */
export const getTasks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { projectId, status, priority, assignee, search, sort } = req.query;

  const { tasks, total } = await TaskService.getWorkspaceTasks(req.workspaceId, {
    projectId: projectId || req.params.projectId,
    status,
    priority,
    assignee,
    search,
    skip,
    limit,
    sort,
  });

  return sendPaginated(res, tasks, { page, limit, total }, 'Tasks retrieved successfully');
});

/**
 * @desc    Get detailed task with subtasks, comments, and history
 * @route   GET /api/workspaces/:workspaceId/tasks/:taskId
 * @access  Protected (MEMBER)
 */
export const getTask = asyncHandler(async (req, res) => {
  const result = await TaskService.getTaskDetails(req.workspaceId, req.params.taskId);
  return sendSuccess(res, result, 'Task details retrieved');
});

/**
 * @desc    Update task details or status
 * @route   PATCH /api/workspaces/:workspaceId/tasks/:taskId
 * @access  Protected (MEMBER)
 */
export const updateTask = asyncHandler(async (req, res) => {
  const updated = await TaskService.updateTask(
    req.workspaceId,
    req.params.taskId,
    req.user._id,
    req.body
  );
  return sendSuccess(res, updated, 'Task updated successfully');
});

/**
 * @desc    Move a task within or between status columns
 * @route   PATCH /api/workspaces/:workspaceId/tasks/:taskId/move
 * @access  Protected (MEMBER)
 */
export const moveTask = asyncHandler(async (req, res) => {
  const updated = await TaskService.moveTask(
    req.workspaceId,
    req.params.taskId,
    req.user._id,
    req.body
  );
  return sendSuccess(res, updated, 'Task moved successfully');
});

/**
 * @desc    Delete a task
 * @route   DELETE /api/workspaces/:workspaceId/tasks/:taskId
 * @access  Protected (MEMBER)
 */
export const deleteTask = asyncHandler(async (req, res) => {
  await TaskService.deleteTask(req.workspaceId, req.params.taskId, req.user._id);
  return sendSuccess(res, {}, 'Task deleted successfully');
});

/**
 * @desc    Add subtask
 * @route   POST /api/workspaces/:workspaceId/tasks/:taskId/subtasks
 * @access  Protected (MEMBER)
 */
export const createSubtask = asyncHandler(async (req, res) => {
  const subtask = await TaskService.createSubtask(req.workspaceId, req.params.taskId, req.body);
  return sendSuccess(res, subtask, 'Subtask added successfully', 201);
});

/**
 * @desc    Update subtask
 * @route   PATCH /api/workspaces/:workspaceId/tasks/:taskId/subtasks/:subtaskId
 * @access  Protected (MEMBER)
 */
export const updateSubtask = asyncHandler(async (req, res) => {
  const updated = await TaskService.updateSubtask(
    req.workspaceId,
    req.params.taskId,
    req.params.subtaskId,
    req.body
  );
  return sendSuccess(res, updated, 'Subtask updated successfully');
});

/**
 * @desc    Delete subtask
 * @route   DELETE /api/workspaces/:workspaceId/tasks/:taskId/subtasks/:subtaskId
 * @access  Protected (MEMBER)
 */
export const deleteSubtask = asyncHandler(async (req, res) => {
  await TaskService.deleteSubtask(req.workspaceId, req.params.taskId, req.params.subtaskId);
  return sendSuccess(res, {}, 'Subtask removed');
});

/**
 * @desc    Add comment to task
 * @route   POST /api/workspaces/:workspaceId/tasks/:taskId/comments
 * @access  Protected (MEMBER)
 */
export const createComment = asyncHandler(async (req, res) => {
  const comment = await TaskService.createComment(
    req.workspaceId,
    req.params.taskId,
    req.user._id,
    req.body
  );
  return sendSuccess(res, comment, 'Comment posted successfully', 201);
});

/**
 * @desc    Get comments for task
 * @route   GET /api/workspaces/:workspaceId/tasks/:taskId/comments
 * @access  Protected (MEMBER)
 */
export const getComments = asyncHandler(async (req, res) => {
  const comments = await TaskService.getTaskComments(req.workspaceId, req.params.taskId);
  return sendSuccess(res, comments, 'Task comments retrieved');
});
