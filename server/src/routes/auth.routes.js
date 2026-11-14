import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
  deactivateAccount,
} from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Strict Rate Limiting for Authentication Attempts (10 attempts per 15 minutes)
const authLimiter = rateLimiter(15 * 60 * 1000, 10);

// Public Routes
router.post('/register', validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

// Protected Routes
router.get('/me', requireAuth, getMe);
router.patch('/profile', requireAuth, validate(updateProfileSchema), updateProfile);
router.patch('/change-password', requireAuth, validate(changePasswordSchema), changePassword);
router.delete('/deactivate', requireAuth, deactivateAccount);

export default router;
