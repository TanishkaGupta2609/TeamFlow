import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User, Workspace, Membership, Invitation } from '../src/models/index.js';
import { config } from '../src/config/env.js';

describe('Stage 05: Workspace and Team Management Test Suite', () => {
  let adminToken = '';
  let adminUser = null;
  let memberToken = '';
  let memberUser = null;
  let outsiderToken = '';
  let outsiderUser = null;

  let testWorkspace = null;
  let memberMembershipId = '';
  let invitationToken = '';
  let invitationId = '';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongodbUri);
    }

    // 1. Create Admin User
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Workspace Admin',
        email: `ws.admin.${Date.now()}@test-ws.com`,
        password: 'Password123!',
        workspaceName: 'Primary Admin HQ',
      });
    adminToken = adminRes.body.data.accessToken;
    adminUser = adminRes.body.data.user;

    // 2. Create Regular Member User
    const memberRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Regular Member',
        email: `ws.member.${Date.now()}@test-ws.com`,
        password: 'Password123!',
      });
    memberToken = memberRes.body.data.accessToken;
    memberUser = memberRes.body.data.user;

    // 3. Create Outsider User (Unrelated to workspace)
    const outsiderRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Outsider User',
        email: `ws.outsider.${Date.now()}@test-ws.com`,
        password: 'Password123!',
      });
    outsiderToken = outsiderRes.body.data.accessToken;
    outsiderUser = outsiderRes.body.data.user;
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({ email: { $regex: '@test-ws\\.com$' } });
      if (testWorkspace?._id) {
        await Workspace.findByIdAndDelete(testWorkspace._id);
        await Membership.deleteMany({ workspace: testWorkspace._id });
        await Invitation.deleteMany({ workspace: testWorkspace._id });
      }
      await mongoose.disconnect();
    }
  });

  describe('1. Workspace Creation & Slug Generation (POST /api/workspaces)', () => {
    it('creates a new workspace and sets creator as ADMIN owner', async () => {
      const res = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Apex Engineering Lab',
          description: 'Core product engineering organization',
          settings: {
            allowMemberInvites: true,
            defaultProjectVisibility: 'PRIVATE',
          },
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Apex Engineering Lab');
      expect(res.body.data.slug).toMatch(/^apex-engineering-lab/);
      expect(res.body.data.owner).toBe(adminUser._id);

      testWorkspace = res.body.data;

      // Verify owner has active ADMIN membership
      const membership = await Membership.findOne({
        workspace: testWorkspace._id,
        user: adminUser._id,
      });
      expect(membership).toBeDefined();
      expect(membership.role).toBe('ADMIN');
      expect(membership.status).toBe('ACTIVE');
    });

    it('rejects duplicate explicit slug with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duplicate Slug Workspace',
          slug: testWorkspace.slug,
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already taken/i);
    });
  });

  describe('2. User Workspaces & Multi-Tenancy (GET /api/workspaces)', () => {
    it('lists all workspaces user actively belongs to', async () => {
      const res = await request(app)
        .get('/api/workspaces')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const found = res.body.data.find((w) => w.workspace._id === testWorkspace._id);
      expect(found).toBeDefined();
      expect(found.role).toBe('ADMIN');
      expect(found.memberCount).toBeGreaterThanOrEqual(1);
    });

    it('allows active member to get workspace details by ID (GET /api/workspaces/:id)', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workspace.name).toBe('Apex Engineering Lab');
      expect(res.body.data.userRole).toBe('ADMIN');
    });

    it('forbids outsider from viewing workspace details (403)', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not an active member/i);
    });
  });

  describe('3. Workspace Update & Settings (PATCH /api/workspaces/:id)', () => {
    it('allows ADMIN to update workspace details and logo', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/${testWorkspace._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Apex Engineering Global',
          description: 'Updated description for multi-region teams',
          logo: 'https://images.unsplash.com/photo-workspace-logo.png',
          settings: {
            defaultProjectVisibility: 'PUBLIC',
          },
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Apex Engineering Global');
      expect(res.body.data.logo).toBe('https://images.unsplash.com/photo-workspace-logo.png');
      expect(res.body.data.settings.defaultProjectVisibility).toBe('PUBLIC');
    });
  });

  describe('4. Team Member Management (Members & Roles)', () => {
    beforeAll(async () => {
      // Add memberUser as a MEMBER to testWorkspace
      const m = await Membership.create({
        workspace: testWorkspace._id,
        user: memberUser._id,
        role: 'MEMBER',
        status: 'ACTIVE',
      });
      memberMembershipId = m._id.toString();
    });

    it('lists workspace members for active participants', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/members`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(2); // Admin and Member
    });

    it('forbids MEMBER from modifying workspace details (403)', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/${testWorkspace._id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'Unauthorized Rename Attempt',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Requires ADMIN permissions/i);
    });

    it('allows ADMIN to promote member to MANAGER', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/${testWorkspace._id}/members/${memberMembershipId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'MANAGER' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('MANAGER');
    });

    it('prevents modifying workspace owner role (400)', async () => {
      const ownerMembership = await Membership.findOne({
        workspace: testWorkspace._id,
        user: adminUser._id,
      });

      const res = await request(app)
        .patch(`/api/workspaces/${testWorkspace._id}/members/${ownerMembership._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'MEMBER' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/owner/i);
    });

    it('allows ADMIN to suspend member status (PATCH status)', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/${testWorkspace._id}/members/${memberMembershipId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SUSPENDED' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('SUSPENDED');

      // Restore to active for further tests
      await Membership.findByIdAndUpdate(memberMembershipId, { status: 'ACTIVE' });
    });

    it('prevents removing workspace owner (400)', async () => {
      const ownerMembership = await Membership.findOne({
        workspace: testWorkspace._id,
        user: adminUser._id,
      });

      const res = await request(app)
        .delete(`/api/workspaces/${testWorkspace._id}/members/${ownerMembership._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/owner/i);
    });
  });

  describe('5. Member Invitation Workflow', () => {
    const inviteeEmail = `invitee.${Date.now()}@test-ws.com`;

    it('creates an invitation with secure random token and expiration (POST /invitations)', async () => {
      const res = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/invitations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: inviteeEmail,
          role: 'MEMBER',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.invitation).toBeDefined();
      expect(res.body.data.invitation.email).toBe(inviteeEmail.toLowerCase());
      expect(res.body.data.invitation.status).toBe('PENDING');
      expect(res.body.data.token).toBeDefined();

      invitationToken = res.body.data.token;
      invitationId = res.body.data.invitation._id;
    });

    it('rejects duplicate pending invitation for same email (409)', async () => {
      const res = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/invitations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: inviteeEmail,
          role: 'MEMBER',
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/pending invitation.*already exists/i);
    });

    it('rejects invitation if user is already an active member (409)', async () => {
      const res = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/invitations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: memberUser.email,
          role: 'MEMBER',
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already.*active member/i);
    });

    it('lists pending invitations for the workspace (GET /invitations)', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${testWorkspace._id}/invitations`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].email).toBe(inviteeEmail.toLowerCase());
    });

    it('resends an invitation with refreshed token (POST /invitations/:id/resend)', async () => {
      const res = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/invitations/${invitationId}/resend`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.token).not.toBe(invitationToken);

      // Update token for acceptance test
      invitationToken = res.body.data.token;
    });

    it('provides public preview of invitation details (GET /invitations/:token)', async () => {
      const res = await request(app).get(`/api/workspaces/invitations/${invitationToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(inviteeEmail.toLowerCase());
      expect(res.body.data.workspace.name).toBe('Apex Engineering Global');
      expect(res.body.data.invitedBy.name).toBe('Workspace Admin');
    });

    it('accepts invitation and registers user as workspace member (POST /accept)', async () => {
      // Use outsiderUser to accept the invitation
      const res = await request(app)
        .post(`/api/workspaces/invitations/${invitationToken}/accept`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workspace._id).toBe(testWorkspace._id);
      expect(res.body.data.membership.role).toBe('MEMBER');

      // Verify membership is now active
      const membership = await Membership.findOne({
        workspace: testWorkspace._id,
        user: outsiderUser._id,
      });
      expect(membership).toBeDefined();
      expect(membership.status).toBe('ACTIVE');

      // Verify invitation status changed to ACCEPTED
      const inv = await Invitation.findById(invitationId);
      expect(inv.status).toBe('ACCEPTED');
    });

    it('rejects re-accepting an already accepted invitation (400)', async () => {
      const res = await request(app)
        .post(`/api/workspaces/invitations/${invitationToken}/accept`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('revokes an invitation successfully (DELETE /invitations/:id)', async () => {
      // Create a fresh invite to revoke
      const freshInviteRes = await request(app)
        .post(`/api/workspaces/${testWorkspace._id}/invitations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `revokeme.${Date.now()}@test-ws.com`,
          role: 'MEMBER',
        });
      const freshId = freshInviteRes.body.data.invitation._id;

      const res = await request(app)
        .delete(`/api/workspaces/${testWorkspace._id}/invitations/${freshId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const inv = await Invitation.findById(freshId);
      expect(inv.status).toBe('REVOKED');
    });
  });

  describe('6. Member Removal & Workspace Deletion', () => {
    it('removes a member from the workspace (DELETE /members/:id)', async () => {
      const res = await request(app)
        .delete(`/api/workspaces/${testWorkspace._id}/members/${memberMembershipId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify member is no longer in workspace
      const membership = await Membership.findById(memberMembershipId);
      expect(membership).toBeNull();
    });

    it('forbids non-owner from deleting workspace (403)', async () => {
      const res = await request(app)
        .delete(`/api/workspaces/${testWorkspace._id}`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows owner to delete workspace and cascade deletes associated data', async () => {
      const res = await request(app)
        .delete(`/api/workspaces/${testWorkspace._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify workspace deleted
      const ws = await Workspace.findById(testWorkspace._id);
      expect(ws).toBeNull();

      // Verify memberships deleted
      const memberships = await Membership.find({ workspace: testWorkspace._id });
      expect(memberships.length).toBe(0);

      // Verify invitations deleted
      const invitations = await Invitation.find({ workspace: testWorkspace._id });
      expect(invitations.length).toBe(0);
    });
  });
});
