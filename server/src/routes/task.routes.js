import { Router } from 'express';
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  createComment,
  getComments,
} from '../controllers/task.controller.js';
import { requireAuth, requireWorkspaceRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createTaskSchema,
  updateTaskSchema,
  createSubtaskSchema,
  updateSubtaskSchema,
  createCommentSchema,
} from '../validators/task.validator.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router
  .route('/')
  .post(requireWorkspaceRole('MEMBER'), validate(createTaskSchema), createTask)
  .get(requireWorkspaceRole('MEMBER'), getTasks);

router
  .route('/:taskId')
  .get(requireWorkspaceRole('MEMBER'), getTask)
  .patch(requireWorkspaceRole('MEMBER'), validate(updateTaskSchema), updateTask)
  .delete(requireWorkspaceRole('MEMBER'), deleteTask);

// Subtasks
router
  .route('/:taskId/subtasks')
  .post(requireWorkspaceRole('MEMBER'), validate(createSubtaskSchema), createSubtask);

router
  .route('/:taskId/subtasks/:subtaskId')
  .patch(requireWorkspaceRole('MEMBER'), validate(updateSubtaskSchema), updateSubtask)
  .delete(requireWorkspaceRole('MEMBER'), deleteSubtask);

// Comments
router
  .route('/:taskId/comments')
  .post(requireWorkspaceRole('MEMBER'), validate(createCommentSchema), createComment)
  .get(requireWorkspaceRole('MEMBER'), getComments);

export default router;
