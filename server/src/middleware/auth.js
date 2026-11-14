import mongoose from 'mongoose';
import { verifyAccessToken } from '../utils/token.js';
import { User, Membership, Workspace } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const ROLE_HIERARCHY = {
  ADMIN: 3,
  MANAGER: 2,
  MEMBER: 1,
};

/**
 * Authentication Middleware: Validates JWT Access Token in Authorization header.
 */
export const requireAuth = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: No authentication token provided',
      errors: [{ field: 'authorization', message: 'Bearer token missing' }],
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found or deleted',
        errors: [{ field: 'user', message: 'User record no longer exists' }],
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.',
        errors: [{ field: 'user', message: 'Account is deactivated' }],
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired',
        errors: [{ field: 'token', message: 'Token expired' }],
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token',
      errors: [{ field: 'token', message: error.message }],
    });
  }
});

/**
 * RBAC Workspace Authorization Middleware.
 * Enforces role level and multi-tenant scoping.
 */
export const requireWorkspaceRole = (minRole = 'MEMBER') =>
  asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking workspace role',
        errors: [],
      });
    }

    const workspaceId =
      req.params.workspaceId ||
      req.body.workspaceId ||
      req.query.workspaceId ||
      req.headers['x-workspace-id'];

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: 'Workspace context identifier required',
        errors: [{ field: 'workspaceId', message: 'Workspace ID was not supplied' }],
      });
    }

    let targetWorkspaceId = workspaceId;
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      const ws = await Workspace.findOne({ slug: workspaceId });
      if (!ws) {
        return res.status(404).json({
          success: false,
          message: `Workspace '${workspaceId}' not found`,
          errors: [{ field: 'workspaceId', message: 'Workspace does not exist' }],
        });
      }
      targetWorkspaceId = ws._id;
    }

    const membership = await Membership.findOne({
      workspace: targetWorkspaceId,
      user: req.user._id,
      status: 'ACTIVE',
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You are not an active member of this workspace',
        errors: [{ field: 'workspace', message: 'Unauthorized workspace access attempt' }],
      });
    }

    const userLevel = ROLE_HIERARCHY[membership.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 1;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires ${minRole} permissions or higher`,
        errors: [{ field: 'role', message: `Your current role is ${membership.role}` }],
      });
    }

    req.membership = membership;
    req.workspaceId = targetWorkspaceId;
    next();
  });
