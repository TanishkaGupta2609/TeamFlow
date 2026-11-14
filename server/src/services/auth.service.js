import crypto from 'crypto';
import { User, Workspace, Membership, RefreshSession } from '../models/index.js';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
} from '../utils/token.js';

export class AuthService {
  /**
   * Register a new user and initialize their primary workspace.
   */
  static async register({ name, email, password, workspaceName, userAgent = '', ipAddress = '' }) {
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      const error = new Error('An account with this email address already exists');
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      isActive: true,
      lastLoginAt: new Date(),
    });

    // Create initial workspace for the user
    const wsTitle = workspaceName || `${name.split(' ')[0]}'s Workspace`;
    const baseSlug = wsTitle
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'workspace';
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const workspace = await Workspace.create({
      name: wsTitle,
      slug,
      owner: user._id,
      description: `Default workspace for ${name}`,
    });

    await Membership.create({
      workspace: workspace._id,
      user: user._id,
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    // Generate JWT Tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Persist Refresh Session
    await RefreshSession.create({
      user: user._id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent,
      ipAddress,
    });

    return {
      user: user.toJSON(),
      workspace,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Authenticate user credentials and create a new refresh session.
   */
  static async login({ email, password, userAgent = '', ipAddress = '' }) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      const error = new Error('Invalid email or password credentials');
      error.statusCode = 401;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Account has been deactivated. Please contact support');
      error.statusCode = 403;
      throw error;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid email or password credentials');
      error.statusCode = 401;
      throw error;
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Fetch user workspaces
    const memberships = await Membership.find({ user: user._id, status: 'ACTIVE' }).populate('workspace');
    const workspaces = memberships.map((m) => m.workspace).filter(Boolean);

    // Generate JWT Tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Persist Refresh Session
    await RefreshSession.create({
      user: user._id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent,
      ipAddress,
    });

    return {
      user: user.toJSON(),
      workspaces,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Rotate refresh token and issue new access token.
   * Includes token reuse detection for compromised session protection.
   */
  static async refreshAccessToken(rawRefreshToken, userAgent = '', ipAddress = '') {
    if (!rawRefreshToken) {
      const error = new Error('Refresh token is required');
      error.statusCode = 401;
      throw error;
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(rawRefreshToken);
    } catch (err) {
      const error = new Error('Invalid or expired refresh token');
      error.statusCode = 401;
      throw error;
    }

    const incomingHash = hashToken(rawRefreshToken);
    const session = await RefreshSession.findOne({ tokenHash: incomingHash });

    if (!session) {
      const error = new Error('Refresh session not found');
      error.statusCode = 401;
      throw error;
    }

    // Token Reuse Detection: If an already revoked token is used, invalidate all sessions for this user!
    if (session.revokedAt) {
      await RefreshSession.updateMany({ user: session.user }, { revokedAt: new Date() });
      const error = new Error('Compromised session detected. All sessions have been revoked.');
      error.statusCode = 403;
      throw error;
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      const error = new Error('User no longer exists or is deactivated');
      error.statusCode = 401;
      throw error;
    }

    // Revoke old session and issue new rotated tokens
    session.revokedAt = new Date();
    await session.save();

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await RefreshSession.create({
      user: user._id,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent,
      ipAddress,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: user.toJSON(),
    };
  }

  /**
   * Logout user by revoking the specified refresh session.
   */
  static async logout(rawRefreshToken) {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await RefreshSession.findOneAndUpdate(
        { tokenHash },
        { revokedAt: new Date() }
      );
    }
  }

  /**
   * Create secure password reset token and store hash on user.
   */
  static async forgotPassword(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Always succeed generically to prevent user enumeration attacks
    if (!user || !user.isActive) {
      return { success: true };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    return {
      success: true,
      resetToken, // Returned for programmatic testing or email dispatch
    };
  }

  /**
   * Reset password with valid reset token and revoke all prior sessions.
   */
  static async resetPassword(token, newPassword) {
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      const error = new Error('Password reset token is invalid or has expired');
      error.statusCode = 400;
      throw error;
    }

    user.passwordHash = await hashPassword(newPassword);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Revoke all prior refresh sessions for safety
    await RefreshSession.updateMany({ user: user._id }, { revokedAt: new Date() });

    return { success: true };
  }

  /**
   * Change password for authenticated user.
   */
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Incorrect current password');
      error.statusCode = 400;
      throw error;
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    // Invalidate sessions
    await RefreshSession.updateMany({ user: user._id }, { revokedAt: new Date() });

    return { success: true };
  }

  /**
   * Update profile fields.
   */
  static async updateProfile(userId, updateData) {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    return user.toJSON();
  }

  /**
   * Deactivate user account.
   */
  static async deactivateAccount(userId) {
    await User.findByIdAndUpdate(userId, { isActive: false });
    await RefreshSession.updateMany({ user: userId }, { revokedAt: new Date() });
    return { success: true };
  }
}

export default AuthService;
