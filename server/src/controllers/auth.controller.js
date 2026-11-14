import { AuthService } from '../services/auth.service.js';
import { Membership } from '../models/index.js';
import { asyncHandler, sendSuccess } from '../utils/index.js';
import { setRefreshCookie, clearRefreshCookie } from '../utils/token.js';

/**
 * @desc    Register a new user account
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const result = await AuthService.register({
    ...req.body,
    userAgent: req.headers['user-agent'] || '',
    ipAddress: req.ip || '',
  });

  setRefreshCookie(res, result.refreshToken);

  return sendSuccess(
    res,
    {
      user: result.user,
      workspace: result.workspace,
      accessToken: result.accessToken,
    },
    'Account registered successfully',
    201
  );
});

/**
 * @desc    Authenticate user & issue tokens
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const result = await AuthService.login({
    ...req.body,
    userAgent: req.headers['user-agent'] || '',
    ipAddress: req.ip || '',
  });

  setRefreshCookie(res, result.refreshToken);

  return sendSuccess(
    res,
    {
      user: result.user,
      workspaces: result.workspaces,
      accessToken: result.accessToken,
    },
    'Authentication successful'
  );
});

/**
 * @desc    Rotate refresh token and issue new access token
 * @route   POST /api/auth/refresh
 * @access  Public (via HttpOnly cookie or body token)
 */
export const refresh = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  const result = await AuthService.refreshAccessToken(
    rawRefreshToken,
    req.headers['user-agent'] || '',
    req.ip || ''
  );

  setRefreshCookie(res, result.refreshToken);

  return sendSuccess(
    res,
    {
      user: result.user,
      accessToken: result.accessToken,
    },
    'Access token refreshed successfully'
  );
});

/**
 * @desc    Logout user & revoke refresh session
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = asyncHandler(async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  await AuthService.logout(rawRefreshToken);
  clearRefreshCookie(res);

  return sendSuccess(res, {}, 'Logged out successfully');
});

/**
 * @desc    Request password reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await AuthService.forgotPassword(req.body.email);
  return sendSuccess(
    res,
    process.env.NODE_ENV === 'test' ? result : {},
    'If the email is registered, password reset instructions have been sent.'
  );
});

/**
 * @desc    Reset password using verification token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  await AuthService.resetPassword(req.body.token, req.body.newPassword);
  clearRefreshCookie(res);

  return sendSuccess(res, {}, 'Password reset successfully. Please log in with your new credentials.');
});

/**
 * @desc    Get currently authenticated user & memberships
 * @route   GET /api/auth/me
 * @access  Protected
 */
export const getMe = asyncHandler(async (req, res) => {
  const memberships = await Membership.find({ user: req.user._id, status: 'ACTIVE' }).populate('workspace');

  return sendSuccess(
    res,
    {
      user: req.user.toJSON(),
      workspaces: memberships.map((m) => ({
        workspace: m.workspace,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    },
    'User profile retrieved'
  );
});

/**
 * @desc    Update user profile
 * @route   PATCH /api/auth/profile
 * @access  Protected
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const updatedUser = await AuthService.updateProfile(req.user._id, req.body);
  return sendSuccess(res, { user: updatedUser }, 'Profile updated successfully');
});

/**
 * @desc    Change password
 * @route   PATCH /api/auth/change-password
 * @access  Protected
 */
export const changePassword = asyncHandler(async (req, res) => {
  await AuthService.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword);
  clearRefreshCookie(res);

  return sendSuccess(res, {}, 'Password changed successfully. Please re-authenticate.');
});

/**
 * @desc    Deactivate user account
 * @route   DELETE /api/auth/deactivate
 * @access  Protected
 */
export const deactivateAccount = asyncHandler(async (req, res) => {
  await AuthService.deactivateAccount(req.user._id);
  clearRefreshCookie(res);

  return sendSuccess(res, {}, 'Account has been deactivated successfully');
});
