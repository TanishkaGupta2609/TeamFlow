import { z } from 'zod';

export const createWorkspaceSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    slug: z
      .string()
      .min(2, 'Slug must be at least 2 characters')
      .max(50)
      .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase alphanumeric characters and hyphens')
      .optional(),
    description: z.string().max(500).optional(),
    logo: z.string().optional(),
  }),
};

export const updateWorkspaceSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
    description: z.string().max(500).optional(),
    logo: z.string().optional(),
    settings: z
      .object({
        allowMemberInvites: z.boolean().optional(),
        defaultProjectVisibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
      })
      .optional(),
  }),
};

export const inviteMemberSchema = {
  body: z.object({
    email: z.string().email('Invalid recipient email address'),
    role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']).default('MEMBER'),
  }),
};

export const updateMemberRoleSchema = {
  body: z.object({
    role: z.enum(['ADMIN', 'MANAGER', 'MEMBER']),
  }),
};

export const updateMemberStatusSchema = {
  body: z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED']),
  }),
};
