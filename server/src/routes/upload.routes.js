import { Router } from 'express';
import { requireAuth, requireWorkspaceRole } from '../middleware/auth.js';
import { uploadSingle } from '../middleware/upload.middleware.js';
import { CloudinaryService } from '../services/cloudinary.service.js';
import { User, Workspace } from '../models/index.js';
import { asyncHandler, sendSuccess, sendError } from '../utils/index.js';

const router = Router();

router.use(requireAuth);

/**
 * @desc    Generic file upload endpoint
 * @route   POST /api/upload
 * @access  Protected
 */
router.post(
  '/',
  uploadSingle('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return sendError(res, 'No file provided for upload', 400);
    }

    const result = await CloudinaryService.uploadBuffer(req.file.buffer, {
      folder: 'teamflow/general',
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
    });

    return sendSuccess(res, {
      name: req.file.originalname,
      url: result.url,
      size: result.size,
      mimeType: result.mimetype,
      publicId: result.publicId,
    }, 'File uploaded successfully', 201);
  })
);

/**
 * @desc    Upload current user profile avatar
 * @route   POST /api/upload/avatar
 * @access  Protected
 */
router.post(
  '/avatar',
  uploadSingle('avatar'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return sendError(res, 'No avatar image provided', 400);
    }

    const result = await CloudinaryService.uploadBuffer(req.file.buffer, {
      folder: 'teamflow/avatars',
      filename: `avatar_${req.user._id}`,
      mimetype: req.file.mimetype,
      resourceType: 'image',
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: result.url },
      { new: true }
    );

    return sendSuccess(res, { user, avatarUrl: result.url }, 'Profile avatar updated successfully');
  })
);

/**
 * @desc    Upload workspace logo
 * @route   POST /api/upload/workspace/:workspaceId/logo
 * @access  Protected (ADMIN)
 */
router.post(
  '/workspace/:workspaceId/logo',
  requireWorkspaceRole('ADMIN'),
  uploadSingle('logo'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return sendError(res, 'No logo image provided', 400);
    }

    const result = await CloudinaryService.uploadBuffer(req.file.buffer, {
      folder: 'teamflow/logos',
      filename: `logo_${req.workspaceId}`,
      mimetype: req.file.mimetype,
      resourceType: 'image',
    });

    const workspace = await Workspace.findByIdAndUpdate(
      req.workspaceId,
      { logo: result.url },
      { new: true }
    );

    return sendSuccess(res, { workspace, logoUrl: result.url }, 'Workspace logo updated successfully');
  })
);

export default router;
