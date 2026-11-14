import express from 'express';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User, Workspace, Membership, RefreshSession } from '../src/models/index.js';
import { config } from '../src/config/env.js';
import { requireAuth, requireWorkspaceRole } from '../src/middleware/auth.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  verifyAccessToken,
  hashToken,
} from '../src/utils/token.js';

describe('Stage 04: Authentication and Authorization Test Suite', () => {
  const testEmail = `auth.test.${Date.now()}@test-auth.com`;
  const testPassword = 'Password123!';
  const newPassword = 'NewPassword456!';
  let accessToken = '';
  let refreshTokenCookie = '';
  let userId = '';
  let workspaceId = '';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongodbUri);
    }
  });

  afterAll(async () => {
    // Clean up test documents
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({ email: { $regex: '@test-auth.com$' } });
      if (workspaceId) {
        await Workspace.findByIdAndDelete(workspaceId);
        await Membership.deleteMany({ workspace: workspaceId });
      }
      if (userId) {
        await RefreshSession.deleteMany({ user: userId });
      }
      await mongoose.disconnect();
    }
  });

  describe('1. Cryptographic and Token Utilities', () => {
    it('hashes passwords securely and compares them accurately', async () => {
      const raw = 'SecureSecret99!';
      const hash = await hashPassword(raw);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(raw);

      const isValid = await comparePassword(raw, hash);
      expect(isValid).toBe(true);

      const isInvalid = await comparePassword('WrongSecret!', hash);
      expect(isInvalid).toBe(false);
    });

    it('generates and verifies JWT access tokens', () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        email: 'jwt@test.com',
        name: 'JWT Tester',
      };
      const token = generateAccessToken(mockUser);
      expect(token).toBeDefined();

      const decoded = verifyAccessToken(token);
      expect(decoded.id).toBe(mockUser._id.toString());
      expect(decoded.email).toBe(mockUser.email);
    });

    it('creates deterministic SHA-256 hashes of refresh tokens', () => {
      const rawToken = 'sample-refresh-uuid-token';
      const hash1 = hashToken(rawToken);
      const hash2 = hashToken(rawToken);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });
  });

  describe('2. Input Validation Middleware', () => {
    it('rejects registration with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid User',
          email: 'not-an-email',
          password: 'ValidPassword123!',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('rejects registration with weak password (< 8 chars)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid User',
          email: 'user@test-auth.com',
          password: '123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects login with missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Registration Endpoint (POST /api/auth/register)', () => {
    it('successfully registers a user, creates default workspace, and sets HttpOnly cookie', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Auth Test User',
          email: testEmail,
          password: testPassword,
          workspaceName: 'Acme Test Corp',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
      expect(res.body.data.user.passwordHash).toBeUndefined(); // Sanitized
      expect(res.body.data.workspace).toBeDefined();
      expect(res.body.data.workspace.name).toBe('Acme Test Corp');
      expect(res.body.data.accessToken).toBeDefined();

      userId = res.body.data.user._id;
      workspaceId = res.body.data.workspace._id;
      accessToken = res.body.data.accessToken;

      // Verify HttpOnly cookie header
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((c) => c.includes('refreshToken='));
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toMatch(/HttpOnly/i);

      refreshTokenCookie = refreshCookie.split(';')[0];
    });

    it('rejects duplicate registration with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate User',
          email: testEmail,
          password: testPassword,
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  describe('4. Login Endpoint (POST /api/auth/login)', () => {
    it('rejects login with wrong password (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'IncorrectPassword999!',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid.*credentials/i);
    });

    it('authenticates successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.workspaces).toBeInstanceOf(Array);
      expect(res.body.data.workspaces.length).toBeGreaterThan(0);

      // Update tokens for subsequent tests
      accessToken = res.body.data.accessToken;
      const cookies = res.headers['set-cookie'];
      const refreshCookie = cookies.find((c) => c.includes('refreshToken='));
      refreshTokenCookie = refreshCookie.split(';')[0];
    });
  });

  describe('5. Token Refresh & Reuse Detection (POST /api/auth/refresh)', () => {
    let firstRefreshTokenCookie = '';

    it('rotates refresh token and issues a new access token', async () => {
      firstRefreshTokenCookie = refreshTokenCookie;

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [firstRefreshTokenCookie]);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();

      // Extract new rotated cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const newCookie = cookies.find((c) => c.includes('refreshToken='));
      expect(newCookie).toBeDefined();

      refreshTokenCookie = newCookie.split(';')[0];
      accessToken = res.body.data.accessToken;
    });

    it('detects token reuse: replaying revoked token returns 403 and invalidates all sessions', async () => {
      // Attempt to reuse firstRefreshTokenCookie which was already rotated/revoked
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [firstRefreshTokenCookie]);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/compromised session/i);

      // Verify all sessions for this user were revoked
      const activeSessions = await RefreshSession.find({
        user: userId,
        revokedAt: null,
      });
      expect(activeSessions.length).toBe(0);
    });
  });

  describe('6. Protected Routes & User Profile', () => {
    beforeAll(async () => {
      // Re-login to get fresh valid tokens after compromised session invalidation
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });
      accessToken = loginRes.body.data.accessToken;
      const cookies = loginRes.headers['set-cookie'];
      refreshTokenCookie = cookies.find((c) => c.includes('refreshToken=')).split(';')[0];
    });

    it('rejects GET /api/auth/me without authorization header (401)', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects GET /api/auth/me with invalid/malformed token (401)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-value');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('retrieves user profile and workspace memberships with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail.toLowerCase());
      expect(res.body.data.workspaces).toBeInstanceOf(Array);
      expect(res.body.data.workspaces[0].role).toBe('ADMIN');
    });

    it('updates user profile via PATCH /api/auth/profile', async () => {
      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Auth Name',
          designation: 'Principal Lead',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Updated Auth Name');
      expect(res.body.data.user.designation).toBe('Principal Lead');
    });

    it('rejects password change if current password is incorrect (400)', async () => {
      const res = await request(app)
        .patch('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongPassword!',
          newPassword: newPassword,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/incorrect.*password/i);
    });

    it('changes password successfully with valid current password', async () => {
      const res = await request(app)
        .patch('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: testPassword,
          newPassword: newPassword,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify login works with new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: newPassword });
      expect(loginRes.statusCode).toBe(200);

      accessToken = loginRes.body.data.accessToken;
      refreshTokenCookie = loginRes.headers['set-cookie']
        .find((c) => c.includes('refreshToken='))
        .split(';')[0];
    });
  });

  describe('7. Password Reset Flow', () => {
    let resetToken = '';

    it('POST /api/auth/forgot-password generates reset token in test environment', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testEmail });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resetToken).toBeDefined();
      resetToken = res.body.data.resetToken;
    });

    it('POST /api/auth/reset-password updates password and invalidates prior token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: testPassword,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Attempting to reuse reset token should fail
      const reuseRes = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'AnotherPassword123!',
        });

      expect(reuseRes.statusCode).toBe(400);
      expect(reuseRes.body.success).toBe(false);

      // Re-login with the reset password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });
      expect(loginRes.statusCode).toBe(200);
      accessToken = loginRes.body.data.accessToken;
      refreshTokenCookie = loginRes.headers['set-cookie']
        .find((c) => c.includes('refreshToken='))
        .split(';')[0];
    });
  });

  describe('8. Role-Based Access Control (RBAC)', () => {
    let rbacApp;

    beforeAll(() => {
      // Register test RBAC endpoint in dedicated router/app
      rbacApp = express();
      rbacApp.use(express.json());
      rbacApp.get(
        '/api/test/rbac-admin/:workspaceId',
        requireAuth,
        requireWorkspaceRole('ADMIN'),
        (req, res) => {
          res.json({ success: true, message: 'ADMIN access granted', workspaceId: req.workspaceId });
        }
      );
      rbacApp.use(errorHandler);
    });

    it('allows ADMIN member to access protected workspace resource', async () => {
      const res = await request(rbacApp)
        .get(`/api/test/rbac-admin/${workspaceId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.workspaceId).toBe(workspaceId);
    });

    it('forbids non-member from accessing workspace resource (403)', async () => {
      const otherEmail = `other.${Date.now()}@test-auth.com`;
      const otherRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Other User',
          email: otherEmail,
          password: 'Password123!',
        });
      const otherToken = otherRes.body.data.accessToken;

      const res = await request(rbacApp)
        .get(`/api/test/rbac-admin/${workspaceId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not an active member/i);
    });

    it('forbids MEMBER role from accessing ADMIN-only resource (403)', async () => {
      // Create user and add as MEMBER to workspace
      const memberEmail = `member.${Date.now()}@test-auth.com`;
      const memberRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Regular Member',
          email: memberEmail,
          password: 'Password123!',
        });
      const memberUser = memberRes.body.data.user;
      const memberToken = memberRes.body.data.accessToken;

      // Add user to first workspace with role 'MEMBER'
      await Membership.create({
        workspace: workspaceId,
        user: memberUser._id,
        role: 'MEMBER',
        status: 'ACTIVE',
      });

      const res = await request(rbacApp)
        .get(`/api/test/rbac-admin/${workspaceId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Requires ADMIN permissions or higher/i);
    });
  });

  describe('9. Account Deactivation & Logout', () => {
    it('deactivates account via DELETE /api/auth/deactivate', async () => {
      const res = await request(app)
        .delete('/api/auth/deactivate')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Subsequent access with bearer token is forbidden (403)
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(meRes.statusCode).toBe(403);
      expect(meRes.body.message).toMatch(/deactivated/i);

      // Subsequent login attempt is forbidden (403)
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });
      expect(loginRes.statusCode).toBe(403);
      expect(loginRes.body.message).toMatch(/deactivated/i);
    });

    it('revokes session on POST /api/auth/logout', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [refreshTokenCookie]);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify cookie cleared
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const clearCookie = cookies.find((c) => c.includes('refreshToken=;'));
      expect(clearCookie).toBeDefined();
    });
  });
});
