import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';

/**
 * Hash plain password using bcryptjs.
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare plain password with stored bcrypt hash.
 */
export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate short-lived JWT access token (15 mins).
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiresIn || '15m' }
  );
};

/**
 * Generate long-lived rotating refresh token (7 days).
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      random: crypto.randomBytes(16).toString('hex'),
    },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn || '7d' }
  );
};

/**
 * Create SHA-256 hash of a token for secure database storage.
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Verify JWT access token.
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret);
};

/**
 * Verify JWT refresh token.
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};

/**
 * Helper to set secure HttpOnly refresh cookie on Express response.
 */
export const setRefreshCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };
  res.cookie('refreshToken', token, cookieOptions);
};

/**
 * Helper to clear refresh cookie on logout.
 */
export const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
    path: '/',
  });
};
