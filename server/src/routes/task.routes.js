import { Router } from 'express';
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  moveTask,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  createComment,
  getComments,
  addTaskAttachments,
  deleteTaskAttachment,
} from '../controllers/task.controller.js';
import { requireAuth, requireWorkspaceRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadMultiple } from '../middleware/upload.middleware.js';
import {
  createTaskSchema,
  updateTaskSchema,
  createSubtaskSchema,
  updateSubtaskSchema,
  createCommentSchema,
  moveTaskSchema,
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

router.patch(
  '/:taskId/move',
  requireWorkspaceRole('MEMBER'),
  validate(moveTaskSchema),
  moveTask
);

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

// Attachments
router
  .route('/:taskId/attachments')
  .post(requireWorkspaceRole('MEMBER'), uploadMultiple('files', 5), addTaskAttachments);

router
  .route('/:taskId/attachments/:attachmentId')
  .delete(requireWorkspaceRole('MEMBER'), deleteTaskAttachment);

export default router;
