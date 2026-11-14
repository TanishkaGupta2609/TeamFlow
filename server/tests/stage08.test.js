import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User, Workspace, Membership, Project, Task, Notification } from '../src/models/index.js';
import { CronService } from '../src/services/cron.service.js';

describe('Stage 08 Backend: Notifications, Calendar & Analytics', () => {
  let userToken;
  let userId;
  let otherToken;
  let otherUserId;
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
    // Clean stage08-specific collections safely without interfering with parallel test suites
    const stage08Users = await User.find({ email: /@stage08\.test/ }).select('_id');
    const userIds = stage08Users.map((u) => u._id);
    const stage08Ws = await Workspace.find({ name: /Stage08/ }).select('_id');
    const wsIds = stage08Ws.map((w) => w._id);

    await Promise.all([
      Membership.deleteMany({ $or: [{ user: { $in: userIds } }, { workspace: { $in: wsIds } }] }),
      Notification.deleteMany({ recipient: { $in: userIds } }),
      Project.deleteMany({ workspace: { $in: wsIds } }),
      Task.deleteMany({ workspace: { $in: wsIds } }),
      Workspace.deleteMany({ _id: { $in: wsIds } }),
      User.deleteMany({ _id: { $in: userIds } }),
    ]);

    // 1. Create primary test user and workspace
    const resUser = await request(app).post('/api/auth/register').send({
      name: 'Stage08 Admin',
      email: `admin.${Date.now()}@stage08.test`,
      password: 'Password123!',
      workspaceName: 'Stage08 Analytics WS',
    });
    userToken = resUser.body.data.accessToken;
    userId = resUser.body.data.user._id;
    workspaceId = resUser.body.data.workspace._id;

    // 2. Create another test user
    const resOther = await request(app).post('/api/auth/register').send({
      name: 'Stage08 Outsider',
      email: `outsider.${Date.now()}@stage08.test`,
      password: 'Password123!',
      workspaceName: 'Outsider Corp',
    });
    otherToken = resOther.body.data.accessToken;
    otherUserId = resOther.body.data.user._id;

    // 4. Create project
    const resProj = await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Stage08 Core Engine',
        description: 'SaaS Platform Analytics',
        status: 'ACTIVE',
        priority: 'HIGH',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    projectId = resProj.body.data._id;

    // 5. Create task
    const resTask = await request(app)
      .post(`/api/workspaces/${workspaceId}/tasks`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        projectId,
        title: 'Stage08 Benchmark Task',
        status: 'IN_PROGRESS',
        priority: 'CRITICAL',
        dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
        assignees: [userId],
      });
    taskId = resTask.body.data._id;
  });

  describe('Notification System & Idempotency', () => {
    it('creates and lists notifications with unread counter', async () => {
      // Notification was automatically dispatched when task was assigned
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.notifications)).toBe(true);
      expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(0);
    });

    it('retrieves unread count endpoint', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(typeof res.body.data.unreadCount).toBe('number');
    });

    it('marks a single notification as read', async () => {
      // Manually create a notification to test
      const notif = await Notification.create({
        recipient: userId,
        workspace: workspaceId,
        type: 'SYSTEM',
        title: 'Test Read Notification',
        message: 'This is a test notification.',
        isRead: false,
      });

      const res = await request(app)
        .patch(`/api/notifications/${notif._id}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isRead).toBe(true);
    });

    it('marks all notifications as read', async () => {
      await Notification.create([
        {
          recipient: userId,
          workspace: workspaceId,
          type: 'SYSTEM',
          title: 'Notif 1',
          message: 'Msg 1',
          isRead: false,
        },
        {
          recipient: userId,
          workspace: workspaceId,
          type: 'SYSTEM',
          title: 'Notif 2',
          message: 'Msg 2',
          isRead: false,
        },
      ]);

      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ workspaceId });

      expect(res.status).toBe(200);

      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ workspaceId });

      expect(countRes.body.data.unreadCount).toBe(0);
    });

    it('deletes a notification', async () => {
      const notif = await Notification.create({
        recipient: userId,
        workspace: workspaceId,
        type: 'SYSTEM',
        title: 'Delete me',
        message: 'Ephemeral notif',
      });

      const res = await request(app)
        .delete(`/api/notifications/${notif._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);

      const check = await Notification.findById(notif._id);
      expect(check).toBeNull();
    });
  });

  describe('Scheduled Background Reminders & Idempotency', () => {
    it('generates reminders for approaching and overdue deadlines without duplicate re-runs', async () => {
      // 1. Create overdue task
      await Task.create({
        workspace: workspaceId,
        project: projectId,
        title: 'Stage08 Past Due Task',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        assignees: [userId],
        createdBy: userId,
      });

      // 2. Run reminder job
      const run1 = await CronService.runDeadlineReminderJob();
      expect(run1.approachingTasks).toBeGreaterThanOrEqual(1); // taskId was set to +12h
      expect(run1.overdueTasks).toBeGreaterThanOrEqual(1); // past due task

      // 3. Run again immediately - verify idempotency keys prevent duplicates
      const run2 = await CronService.runDeadlineReminderJob();
      expect(run2.approachingTasks).toBeGreaterThanOrEqual(1);

      // Verify no duplicate notifications exist in DB
      const userNotifs = await Notification.find({ recipient: userId });
      const overdueNotifs = userNotifs.filter((n) => n.type === 'TASK_OVERDUE');
      expect(overdueNotifs.length).toBe(1);
    });
  });

  describe('Workspace Analytics Aggregation', () => {
    it('returns calculated metrics matching MongoDB database records', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/analytics`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { overview, statusDistribution, priorityDistribution, weeklyVelocity, teamWorkload } = res.body.data;

      expect(overview.totalProjects).toBe(1);
      expect(overview.activeProjects).toBe(1);
      expect(overview.totalTasks).toBeGreaterThanOrEqual(1);
      expect(overview.inProgressTasks).toBe(1);

      // Status distribution array has 5 statuses
      expect(statusDistribution.length).toBe(5);
      expect(statusDistribution.some((s) => s.status === 'IN_PROGRESS')).toBe(true);

      // Priority distribution has 4 priorities
      expect(priorityDistribution.length).toBe(4);
      expect(priorityDistribution.find((p) => p.priority === 'CRITICAL').count).toBe(1);

      // Team workload tracks active user
      expect(Array.isArray(teamWorkload)).toBe(true);
      expect(teamWorkload.some((m) => m.memberId.toString() === userId.toString())).toBe(true);
    });

    it('rejects non-members attempting to access workspace analytics with 403', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/analytics`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Calendar Deadlines & Milestones', () => {
    it('returns scheduled tasks and project deadlines in range', async () => {
      const start = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const end = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/calendar`)
        .set('Authorization', `Bearer ${userToken}`)
        .query({ startDate: start, endDate: end });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.tasks)).toBe(true);
      expect(Array.isArray(res.body.data.projects)).toBe(true);

      expect(res.body.data.tasks.some((t) => t._id.toString() === taskId.toString())).toBe(true);
      expect(res.body.data.projects.some((p) => p._id.toString() === projectId.toString())).toBe(true);
    });

    it('rejects non-members attempting to access calendar with 403', async () => {
      const res = await request(app)
        .get(`/api/workspaces/${workspaceId}/calendar`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
    });
  });
});
