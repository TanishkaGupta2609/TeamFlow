import { z } from 'zod';

export const createTaskSchema = {
  body: z.object({
    projectId: z.string().min(1, 'Project ID is required').optional(),
    title: z.string().min(2, 'Task title must be at least 2 characters').max(200),
    description: z.string().max(5000).optional(),
    status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT']).optional(),
    assignees: z.array(z.string()).optional(),
    dueDate: z.string().datetime().optional().nullable(),
    labels: z.array(z.string()).optional(),
    position: z.number().optional(),
  }),
};

export const updateTaskSchema = {
  body: z.object({
    title: z.string().min(2, 'Task title must be at least 2 characters').max(200).optional(),
    description: z.string().max(5000).optional(),
    status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT']).optional(),
    assignees: z.array(z.string()).optional(),
    dueDate: z.string().datetime().optional().nullable(),
    labels: z.array(z.string()).optional(),
    position: z.number().optional(),
    projectId: z.string().optional(),
  }),
};

export const createSubtaskSchema = {
  body: z.object({
    title: z.string().min(1, 'Subtask title cannot be empty').max(200),
    assignedTo: z.string().optional().nullable(),
  }),
};

export const updateSubtaskSchema = {
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    completed: z.boolean().optional(),
    assignedTo: z.string().optional().nullable(),
  }),
};

export const createCommentSchema = {
  body: z.object({
    content: z.string().min(1, 'Comment content cannot be empty').max(2000),
    attachments: z
      .array(
        z.object({
          name: z.string(),
          url: z.string(),
          size: z.number().optional(),
        })
      )
      .optional(),
  }),
};

export const moveTaskSchema = {
  body: z.object({
    status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
    position: z.number().optional(),
    previousTaskId: z.string().optional().nullable(),
    nextTaskId: z.string().optional().nullable(),
  }),
};
