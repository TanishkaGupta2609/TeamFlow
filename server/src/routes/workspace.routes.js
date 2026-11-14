import { Router } from 'express';
import { createWorkspace, getWorkspace, listWorkspaces } from '../controllers/workspace.controller.js';
import { validate } from '../middleware/validate.js';
import { createWorkspaceSchema, getWorkspaceSchema } from '../validators/workspace.validator.js';

const router = Router();

router.route('/')
  .post(validate(createWorkspaceSchema), createWorkspace)
  .get(listWorkspaces);

router.route('/:slug')
  .get(validate(getWorkspaceSchema), getWorkspace);

export default router;
