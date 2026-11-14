import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User, Workspace, Membership, Project, Task, Subtask, Comment, ActivityLog } from '../src/models/index.js';
import { config } from '../src/config/env.js';

describe('Stage 06: Project and Task Management Test Suite', () => {
  let adminToken = '';
  let adminUser = null;
  let memberToken = '';
  let memberUser = null;
  let outsiderToken = '';
  let outsiderUser = null;

  let workspaceId = '';
  let projectId = '';
  let taskId = '';
  let subtaskId = '';
  let commentId = '';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongodbUri);
    }

    // 1. Create Workspace Admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Project Admin',
        email: `proj.admin.${Date.now()}@test-proj.com`,
        password: 'Password123!',
        workspaceName: 'Project Management HQ',
      });
    adminToken = adminRes.body.data.accessToken;
    adminUser = adminRes.body.data.user;
    workspaceId = adminRes.body.data.workspace._id;

    // 2. Create Workspace Member
    const memberRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Project Dev Member',
        email: `proj.member.${Date.now()}@test-proj.com`,
        password: 'Password123!',
      });
    memberToken = memberRes.body.data.accessToken;
    memberUser = memberRes.body.data.user;

    // Add member to workspace
    await Membership.create({
      workspace: workspaceId,
      user: memberUser._id,
      role: 'MEMBER',
      status: 'ACTIVE',
    });

    // 3. Create Outsider (Unrelated user)
    const outsiderRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Project Outsider',
        email: `proj.outsider.${Date.now()}@test-proj.com`,
        password: 'Password123!',
      });
    outsiderToken = outsiderRes.body.data.accessToken;
    outsiderUser = outsiderRes.body.data.user;
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({ email: { $regex: '@test-proj\\.com$' } });
      if (workspaceId) {
        await Workspace.findByIdAndDelete(workspaceId);
        await Membership.deleteMany({ workspace: workspaceId });
        await Project.deleteMany({ workspace: workspaceId });
        await Task.deleteMany({ workspace: workspaceId });
        await Subtask.deleteMany({});
        await Comment.deleteMany({ workspace: workspaceId });
        await ActivityLog.deleteMany({ workspace: workspaceId });
      }
      await mongoose.disconnect();
    }
  });

  describe('1. Project Creation & Validations', () => {
    it('creates a new project with dates, priority, and members', async () => {
      const startDate = new Date();
      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days later

      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/projects`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'TeamFlow Core Engine',
          description: 'High-performance task pipeline and real-time backend engine',
          color: '#173F35',
          startDate: startDate.toISOString(),
          dueDate: dueDate.toISOString(),
          status: 'ACTIVE',
          priority: 'CRITICAL',
          members: [memberUser._id],
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('TeamFlow Core Engine');
      expect(res.body.data.priority).toBe('CRITICAL');
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.progress).toBe(0);

      projectId = res.body.data._id;
    });

    it('rejects project creation if dueDate is earlier than startDate (400)', async () => {
      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/projects`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Date Project',
          startDate: new Date(Date.now() + 10 * 86400000).toISOString(),
          dueDate: new Date(Date.now() - 5 * 86400000).toISOString(),
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/due date cannot be earlier/i);
    });

    it('records ActivityLog when project is created', async () => {
      const log = await ActivityLog.findOne({
        workspace: workspaceId,
        entityId: projectId,
        action: 'PROJECT_CREATED',
      });
      expect(log).toBeDefined();
      expect(log.actor.toString()).toBe(adminUser._id);
    });
  });

  describe('2. Project Retrieval, Metrics & Updates', () => {
    it('lists workspace projects with filtering (GET /projects)', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/projects?priority=CRITICAL`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].name).toBe('TeamFlow Core Engine');
    });

    it('gets single project details with task metrics (GET /projects/:id)', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/projects/${projectId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project._id).toBe(projectId);
      expect(res.body.data.metrics).toBeDefined();
      expect(res.body.data.metrics.totalTasks).toBe(0);
    });

    it('updates project details (PATCH /projects/:id)', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/${workspaceId}/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'TeamFlow Core Engine 2.0',
          description: 'Updated architecture documentation',
          priority: 'HIGH',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('TeamFlow Core Engine 2.0');
      expect(res.body.data.priority).toBe('HIGH');
    });

    it('archives project (PATCH /projects/:id/archive)', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/${workspaceId}/projects/${projectId}/archive`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ARCHIVED');

      // Restore to ACTIVE for task testing
      await Project.findByIdAndUpdate(projectId, { status: 'ACTIVE' });
    });
  });

  describe('3. Task Creation, Assignment & Progress Calculation', () => {
    it('creates a task within project and workspace (POST /tasks)', async () => {
      const dueDate = new Date(Date.now() + 5 * 86400000);

      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Implement Database Connection Manager',
          description: 'Write resilient mongoose connection with retry policies',
          status: 'TODO',
          priority: 'HIGH',
          assignees: [memberUser._id],
          dueDate: dueDate.toISOString(),
          labels: ['backend', 'database'],
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Implement Database Connection Manager');
      expect(res.body.data.status).toBe('TODO');
      expect(res.body.data.project).toBe(projectId);
      expect(res.body.data.assignees).toContain(memberUser._id);
      expect(res.body.data.labels).toContain('database');

      taskId = res.body.data._id;
    });

    it('lists tasks in workspace with filters (GET /tasks)', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/tasks?projectId=${projectId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Implement Database Connection Manager');
    });

    it('gets full task details including history (GET /tasks/:id)', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task._id).toBe(taskId);
      expect(res.body.data.subtasks).toBeInstanceOf(Array);
      expect(res.body.data.comments).toBeInstanceOf(Array);
      expect(res.body.data.history).toBeInstanceOf(Array);
    });

    it('updates task status to DONE and automatically recalculates project progress to 100%', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/${workspaceId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          status: 'DONE',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('DONE');

      // Verify project progress updated to 100% (1 completed out of 1 task)
      const project = await Project.findById(projectId);
      expect(project.progress).toBe(100);

      // Verify ActivityLog recorded TASK_STATUS_CHANGED
      const log = await ActivityLog.findOne({
        entityId: taskId,
        action: 'TASK_STATUS_CHANGED',
      });
      expect(log).toBeDefined();
      expect(log.metadata.to).toBe('DONE');
    });
  });

  describe('4. Subtasks and Comments Workflow', () => {
    it('creates a subtask under task (POST /subtasks)', async () => {
      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/tasks/${taskId}/subtasks`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Write automated ping test',
          assignedTo: memberUser._id,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Write automated ping test');
      expect(res.body.data.completed).toBe(false);

      subtaskId = res.body.data._id;
    });

    it('toggles subtask completion (PATCH /subtasks/:id)', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/${workspaceId}/tasks/${taskId}/subtasks/${subtaskId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          completed: true,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.completed).toBe(true);
    });

    it('adds a comment to the task (POST /comments)', async () => {
      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          content: 'Database connection retry loop has passed stress testing.',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('Database connection retry loop has passed stress testing.');
      expect(res.body.data.author.name).toBe('Project Dev Member');

      commentId = res.body.data._id;
    });

    it('lists comments for the task (GET /comments)', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/tasks/${taskId}/comments`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('deletes subtask (DELETE /subtasks/:id)', async () => {
      const res = await request(app)
        .delete(`/api/workspaces/${workspaceId}/tasks/${taskId}/subtasks/${subtaskId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const subtask = await Subtask.findById(subtaskId);
      expect(subtask).toBeNull();
    });
  });

  describe('5. Multi-Tenancy & Authorization Restrictions', () => {
    it('forbids outsider from accessing workspace projects (403)', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/projects`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not an active member/i);
    });

    it('forbids outsider from creating tasks in workspace (403)', async () => {
      const res = await request(app)
        .post(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({
          title: 'Unauthorized Intrusion Task',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('forbids MEMBER from deleting a project (403)', async () => {
      const res = await request(app)
        .delete(`/api/workspaces/${workspaceId}/projects/${projectId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Requires MANAGER permissions or higher/i);
    });
  });

  describe('6. Task and Project Deletion with Cascades', () => {
    it('deletes a task and its comments (DELETE /tasks/:id)', async () => {
      const res = await request(app)
        .delete(`/api/workspaces/${workspaceId}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify task and comments deleted
      const task = await Task.findById(taskId);
      expect(task).toBeNull();

      const comments = await Comment.find({ task: taskId });
      expect(comments.length).toBe(0);

      // Verify project progress reset to 0
      const project = await Project.findById(projectId);
      expect(project.progress).toBe(0);
    });

    it('allows ADMIN to delete project and cascade cleanup (DELETE /projects/:id)', async () => {
      const res = await request(app)
        .delete(`/api/workspaces/${workspaceId}/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const project = await Project.findById(projectId);
      expect(project).toBeNull();
    });
  });
});
