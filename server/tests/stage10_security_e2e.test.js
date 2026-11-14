import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User, Workspace, Membership, Project, Task, Comment, RefreshSession } from '../src/models/index.js';
import { MemoryRateLimiter } from '../src/middleware/rateLimiter.js';
import { sanitizeObject } from '../src/middleware/sanitize.middleware.js';

describe('Stage 10: Testing, Validation, Security & Cross-Workspace Isolation', () => {
  let userA, tokenA, wsA, projectA, taskA;
  let userB, tokenB, wsB;
  let userMember, tokenMember;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/teamflow';
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up stage 10 test records
    const testUsers = await User.find({ email: /@stage10\.test/ }).select('_id');
    const userIds = testUsers.map((u) => u._id);
    const testWs = await Workspace.find({ name: /Stage10/ }).select('_id');
    const wsIds = testWs.map((w) => w._id);

    await Promise.all([
      Membership.deleteMany({ $or: [{ user: { $in: userIds } }, { workspace: { $in: wsIds } }] }),
      Project.deleteMany({ workspace: { $in: wsIds } }),
      Task.deleteMany({ workspace: { $in: wsIds } }),
      Comment.deleteMany({ workspace: { $in: wsIds } }),
      RefreshSession.deleteMany({ user: { $in: userIds } }),
      Workspace.deleteMany({ _id: { $in: wsIds } }),
      User.deleteMany({ _id: { $in: userIds } }),
    ]);

    const timestamp = Date.now();

    // 1. Setup User A (Workspace A Admin)
    const resA = await request(app).post('/api/auth/register').send({
      name: 'Alice Admin',
      email: `alice.${timestamp}@stage10.test`,
      password: 'Password123!',
      workspaceName: 'Stage10 Workspace Alpha',
    });
    tokenA = resA.body.data.accessToken;
    userA = resA.body.data.user;
    wsA = resA.body.data.workspace;

    // Create a project and task in Workspace A
    const resProjA = await request(app)
      .post(`/api/workspaces/${wsA._id}/projects`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Alpha Secret Roadmap',
        description: 'Confidential project specs for Workspace Alpha',
      });
    projectA = resProjA.body.data;

    const resTaskA = await request(app)
      .post(`/api/workspaces/${wsA._id}/projects/${projectA._id}/tasks`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Alpha Core Kernel Task',
        priority: 'CRITICAL',
      });
    taskA = resTaskA.body.data;

    // 2. Setup User B (Completely Separate Workspace B Admin)
    const resB = await request(app).post('/api/auth/register').send({
      name: 'Bob Competitor',
      email: `bob.${timestamp}@stage10.test`,
      password: 'Password123!',
      workspaceName: 'Stage10 Workspace Beta',
    });
    tokenB = resB.body.data.accessToken;
    userB = resB.body.data.user;
    wsB = resB.body.data.workspace;

    // 3. Setup User Member in Workspace A (Role: MEMBER)
    const resMember = await request(app).post('/api/auth/register').send({
      name: 'Charlie Member',
      email: `charlie.${timestamp}@stage10.test`,
      password: 'Password123!',
      workspaceName: 'Stage10 Charlie Personal',
    });
    tokenMember = resMember.body.data.accessToken;
    userMember = resMember.body.data.user;

    // Add Charlie as MEMBER to Workspace A
    await Membership.create({
      workspace: wsA._id,
      user: userMember._id,
      role: 'MEMBER',
      status: 'ACTIVE',
    });
  });

  describe('1. Cross-Workspace Data Isolation & Multi-Tenant Boundaries', () => {
    it('prevents User B from accessing projects in Workspace A (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${wsA._id}/projects`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not an active member of this workspace/i);
    });

    it('prevents User B from viewing or listing tasks in Workspace A (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${wsA._id}/tasks`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('prevents User B from modifying or moving a task in Workspace A (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/${wsA._id}/tasks/${taskA._id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ status: 'DONE' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('prevents User B from accessing analytics or calendar in Workspace A (403 Forbidden)', async () => {
      const resAnalytics = await request(app)
        .get(`/api/workspaces/${wsA._id}/analytics`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(resAnalytics.status).toBe(403);

      const resCalendar = await request(app)
        .get(`/api/workspaces/${wsA._id}/calendar`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(resCalendar.status).toBe(403);
    });
  });

  describe('2. Role-Based Access Control (RBAC) Enforcement', () => {
    it('prevents MEMBER from updating workspace configuration (requires ADMIN)', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/${wsA._id}`)
        .set('Authorization', `Bearer ${tokenMember}`)
        .send({ name: 'Hacked Workspace Name' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/ADMIN/i);
    });

    it('prevents MEMBER from deleting a project (requires MANAGER or ADMIN)', async () => {
      const res = await request(app)
        .delete(`/api/workspaces/${wsA._id}/projects/${projectA._id}`)
        .set('Authorization', `Bearer ${tokenMember}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/MANAGER/i);
    });

    it('allows ADMIN to perform privileged operations successfully', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/${wsA._id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ description: 'Updated by Verified Admin' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toBe('Updated by Verified Admin');
    });
  });

  describe('3. Session Security, Token Rotation & Compromise Detection', () => {
    it('rotates refresh token and detects reuse attack by invalidating all sessions', async () => {
      // Login to obtain fresh tokens and cookies
      const loginRes = await request(app).post('/api/auth/login').send({
        email: userA.email,
        password: 'Password123!',
      });
      expect(loginRes.status).toBe(200);

      const cookies = loginRes.headers['set-cookie'];
      const refreshCookie = cookies?.find((c) => c.includes('refreshToken='));
      const firstRefreshToken = refreshCookie ? refreshCookie.split(';')[0].split('=')[1] : null;
      expect(firstRefreshToken).toBeDefined();
      expect(firstRefreshToken).not.toBeNull();

      // 1. Perform legitimate token refresh
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: firstRefreshToken });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.accessToken).toBeDefined();

      const refreshCookies = refreshRes.headers['set-cookie'];
      const secondCookie = refreshCookies?.find((c) => c.includes('refreshToken='));
      const secondRefreshToken = secondCookie ? secondCookie.split(';')[0].split('=')[1] : null;
      expect(secondRefreshToken).toBeDefined();
      expect(secondRefreshToken).not.toBe(firstRefreshToken);

      // 2. Attempt token reuse attack: present the old, already revoked firstRefreshToken
      const attackRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: firstRefreshToken });

      // Must be rejected with 403 Compromised Session
      expect(attackRes.status).toBe(403);
      expect(attackRes.body.message).toMatch(/compromised session detected/i);

      // 3. Verify that the user's secondRefreshToken was also invalidated due to compromise
      const subsequentRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: secondRefreshToken });

      expect(subsequentRes.status).toBe(403);
    });

    it('rejects tampered or forged JWT tokens with 401 Unauthorized', async () => {
      const forgedToken = tokenA.slice(0, -5) + 'xxxxx';
      const res = await request(app)
        .get(`/api/workspaces/${wsA._id}/projects`)
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid authorization token|invalid signature/i);
    });
  });

  describe('4. Input Validation & NoSQL Injection Protection', () => {
    it('sanitizes input objects by stripping potential NoSQL injection operators', () => {
      const maliciousPayload = {
        email: { $gt: '' },
        password: 'Password123!',
        $where: 'sleep(5000)',
        nested: {
          $ne: null,
          legit: 'safe_value',
        },
      };

      const cleaned = sanitizeObject(maliciousPayload);

      expect(cleaned.$where).toBeUndefined();
      expect(cleaned.email).toEqual({});
      expect(cleaned.nested.$ne).toBeUndefined();
      expect(cleaned.nested.legit).toBe('safe_value');
      expect(cleaned.password).toBe('Password123!');
    });

    it('rejects registration requests with missing or invalid input via Zod schema', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'invalid-email-address',
        password: '123', // too short
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('5. Rate Limiting Engine', () => {
    it('enforces request threshold and sends 429 Too Many Requests when limit exceeded', async () => {
      const limiter = new MemoryRateLimiter(60000, 3); // 3 requests max per minute
      const middleware = limiter.middleware({ skipTestCheck: true });

      const fakeReq = { ip: '192.168.1.100', connection: {} };
      const headers = {};
      const fakeRes = {
        setHeader: (k, v) => { headers[k] = v; },
        status: (code) => {
          fakeRes.statusCode = code;
          return {
            json: (body) => { fakeRes.body = body; return fakeRes; },
          };
        },
      };

      let nextCalled = 0;
      const fakeNext = () => { nextCalled++; };

      // Requests 1, 2, 3 should succeed
      middleware(fakeReq, fakeRes, fakeNext);
      middleware(fakeReq, fakeRes, fakeNext);
      middleware(fakeReq, fakeRes, fakeNext);
      expect(nextCalled).toBe(3);

      // Request 4 should be throttled with 429
      middleware(fakeReq, fakeRes, fakeNext);
      expect(fakeRes.statusCode).toBe(429);
      expect(fakeRes.body.success).toBe(false);
      expect(fakeRes.body.message).toMatch(/too many requests/i);
    });
  });

  describe('6. Safe Error Formatting & Secret Shielding', () => {
    it('returns consistent structured 404 response for unknown routes', async () => {
      const res = await request(app).get('/api/unknown-nonexistent-endpoint');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Resource not found/i);
    });

    it('handles malformed ObjectId gracefully without exposing internal database errors', async () => {
      const res = await request(app)
        .get('/api/workspaces/invalid-mongo-id-12345/projects')
        .set('Authorization', `Bearer ${tokenA}`);

      expect([400, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
      expect(res.body.stack).toBeUndefined(); // Stack trace never exposed
    });
  });
});
