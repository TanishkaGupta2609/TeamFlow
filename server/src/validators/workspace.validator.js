import { z } from 'zod';

export const createWorkspaceSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    slug: z
      .string()
      .min(2, 'Slug must be at least 2 characters')
      .max(50)
      .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase alphanumeric characters and hyphens'),
    description: z.string().max(500).optional(),
    logo: z.string().optional(),
  }),
};

export const getWorkspaceSchema = {
  params: z.object({
    slug: z.string().min(1),
  }),
};
