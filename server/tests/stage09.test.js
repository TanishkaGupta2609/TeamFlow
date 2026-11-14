import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User, Workspace, Membership, Project, Task } from '../src/models/index.js';
import { EmailService } from '../src/services/email.service.js';
import { CloudinaryService } from '../src/services/cloudinary.service.js';

describe('Stage 09 Backend: File Uploads & Email Integration', () => {
  let userToken;
  let userId;
  let workspaceId;
  let projectId;
  let taskId;

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
    const stage09Users = await User.find({ email: /@stage09\.test/ }).select('_id');
    const userIds = stage09Users.map((u) => u._id);
    const stage09Ws = await Workspace.find({ name: /Stage09/ }).select('_id');
    const wsIds = stage09Ws.map((w) => w._id);

    await Promise.all([
      Membership.deleteMany({ $or: [{ user: { $in: userIds } }, { workspace: { $in: wsIds } }] }),
      Project.deleteMany({ workspace: { $in: wsIds } }),
      Task.deleteMany({ workspace: { $in: wsIds } }),
      Workspace.deleteMany({ _id: { $in: wsIds } }),
      User.deleteMany({ _id: { $in: userIds } }),
    ]);

    // Create user and workspace
    const resUser = await request(app).post('/api/auth/register').send({
      name: 'Stage09 Admin',
      email: `admin.${Date.now()}@stage09.test`,
      password: 'Password123!',
      workspaceName: 'Stage09 Files WS',
    });
    userToken = resUser.body.data.accessToken;
    userId = resUser.body.data.user._id;
    workspaceId = resUser.body.data.workspace._id;

    // Create project
    const resProj = await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Stage09 Attachments Project',
        status: 'ACTIVE',
        priority: 'HIGH',
      });
    projectId = resProj.body.data._id;

    // Create task
    const resTask = await request(app)
      .post(`/api/workspaces/${workspaceId}/tasks`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        projectId,
        title: 'Stage09 Task with Attachments',
        status: 'TODO',
        priority: 'MEDIUM',
      });
    taskId = resTask.body.data._id;
  });

  describe('File Upload Endpoints & Cloudinary Fallback', () => {
    it('uploads a generic document file via POST /api/upload', async () => {
      const buffer = Buffer.from('Mock PDF Document File Content for TeamFlow');

      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', buffer, { filename: 'spec.pdf', contentType: 'application/pdf' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('spec.pdf');
      expect(res.body.data.url).toBeDefined();
      expect(res.body.data.publicId).toBeDefined();
      expect(res.body.data.size).toBeGreaterThan(0);
    });

    it('rejects forbidden file types with 400', async () => {
      const buffer = Buffer.from('malicious payload');

      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('file', buffer, { filename: 'dangerous.exe', contentType: 'application/x-msdownload' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/unsupported file type/i);
    });

    it('uploads profile avatar via POST /api/upload/avatar and updates user', async () => {
      const buffer = Buffer.from('PNG_MOCK_IMAGE_DATA');

      const res = await request(app)
        .post('/api/upload/avatar')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('avatar', buffer, { filename: 'my_avatar.png', contentType: 'image/png' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.avatarUrl).toBeDefined();

      const user = await User.findById(userId);
      expect(user.avatar).toBe(res.body.data.avatarUrl);
    });

    it('uploads workspace logo via POST /api/upload/workspace/:id/logo', async () => {
      const buffer = Buffer.from('LOGO_MOCK_DATA');

      const res = await request(app)
        .post(`/api/upload/workspace/${workspaceId}/logo`)
        .set('Authorization', `Bearer ${userToken}`)
        .attach('logo', buffer, { filename: 'brand_logo.png', contentType: 'image/png' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.logoUrl).toBeDefined();

      const ws = await Workspace.findById(workspaceId);
      expect(ws.logo).toBe(res.body.data.logoUrl);
    });

    it('attaches files to a task and deletes attachment with cleanup', async () => {
      const file1 = Buffer.from('Attachment Content 1');
      const file2 = Buffer.from('Attachment Content 2');

      const resUpload = await request(app)
        .post(`/api/workspaces/${workspaceId}/tasks/${taskId}/attachments`)
        .set('Authorization', `Bearer ${userToken}`)
        .attach('files', file1, { filename: 'notes.txt', contentType: 'text/plain' })
        .attach('files', file2, { filename: 'data.csv', contentType: 'text/csv' });

      expect(resUpload.status).toBe(201);
      expect(resUpload.body.success).toBe(true);
      expect(resUpload.body.data.length).toBe(2);

      const attachmentId = resUpload.body.data[0]._id;

      // Delete attachment
      const resDelete = await request(app)
        .delete(`/api/workspaces/${workspaceId}/tasks/${taskId}/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(resDelete.status).toBe(200);

      const task = await Task.findById(taskId);
      expect(task.attachments.length).toBe(1);
    });
  });

  describe('Nodemailer Email Service Templates', () => {
    it('dispatches welcome email with branded layout', async () => {
      const res = await EmailService.sendWelcomeEmail({
        to: 'newuser@stage09.test',
        name: 'New User',
      });
      expect(res.sent).toBe(true);
    });

    it('dispatches workspace invitation email', async () => {
      const res = await EmailService.sendWorkspaceInvitationEmail({
        to: 'invitee@stage09.test',
        inviterName: 'Lead Admin',
        workspaceName: 'Stage09 Files WS',
        role: 'MEMBER',
        inviteUrl: 'http://localhost:5173/accept-invitation?token=mock_token_123',
      });
      expect(res.sent).toBe(true);
    });

    it('dispatches password reset email', async () => {
      const res = await EmailService.sendPasswordResetEmail({
        to: 'user@stage09.test',
        name: 'Test User',
        resetUrl: 'http://localhost:5173/reset-password?token=mock_token_456',
      });
      expect(res.sent).toBe(true);
    });

    it('dispatches task assignment email', async () => {
      const res = await EmailService.sendTaskAssignmentEmail({
        to: 'assignee@stage09.test',
        name: 'Assignee User',
        taskTitle: 'Audit API Performance',
        projectName: 'Stage09 Core',
        workspaceName: 'Stage09 Files WS',
        priority: 'CRITICAL',
        dueDate: '2026-11-20',
      });
      expect(res.sent).toBe(true);
    });

    it('dispatches upcoming deadline email', async () => {
      const res = await EmailService.sendDeadlineReminderEmail({
        to: 'assignee@stage09.test',
        name: 'Assignee User',
        taskTitle: 'Audit API Performance',
        workspaceName: 'Stage09 Files WS',
        dueDate: new Date(),
      });
      expect(res.sent).toBe(true);
    });

    it('dispatches project milestone email', async () => {
      const res = await EmailService.sendProjectMilestoneEmail({
        to: 'lead@stage09.test',
        name: 'Lead User',
        projectName: 'Enterprise SaaS MVP',
        workspaceName: 'Stage09 Files WS',
        status: 'ACTIVE',
        progress: 90,
      });
      expect(res.sent).toBe(true);
    });
  });
});
