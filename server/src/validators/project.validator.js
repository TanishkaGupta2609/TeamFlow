import { z } from 'zod';

export const createProjectSchema = {
  body: z.object({
    name: z.string().min(2, 'Project name must be at least 2 characters').max(120),
    description: z.string().max(1000).optional(),
    color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid color hex code').optional(),
    startDate: z.string().datetime().optional().nullable(),
    dueDate: z.string().datetime().optional().nullable(),
    status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ARCHIVED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT']).optional(),
    manager: z.string().optional().nullable(),
    members: z.array(z.string()).optional(),
  }),
};

export const updateProjectSchema = {
  body: z.object({
    name: z.string().min(2, 'Project name must be at least 2 characters').max(120).optional(),
    description: z.string().max(1000).optional(),
    color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid color hex code').optional(),
    startDate: z.string().datetime().optional().nullable(),
    dueDate: z.string().datetime().optional().nullable(),
    status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ARCHIVED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT']).optional(),
    manager: z.string().optional().nullable(),
    members: z.array(z.string()).optional(),
  }),
};
