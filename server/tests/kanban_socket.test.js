import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import http from 'http';
import mongoose from 'mongoose';
import { io as ClientIO } from 'socket.io-client';
import app from '../src/app.js';
import { initSocket, getIO } from '../src/socket/index.js';
import { User, Workspace, Membership, Project, Task, ActivityLog } from '../src/models/index.js';
import { config } from '../src/config/env.js';

describe('Stage 07: Kanban Board & Real-Time Socket.IO Test Suite', () => {
  let server;
  let serverPort;
  let ioServer;

  let adminToken = '';
  let adminUser = null;
  let memberToken = '';
  let memberUser = null;
  let outsiderToken = '';
  let outsiderUser = null;

  let workspaceId = '';
  let projectId = '';
  let task1Id = '';
  let task2Id = '';
  let task3Id = '';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongodbUri);
    }

    // 1. Create HTTP Server & Initialize Sockets
    server = http.createServer(app);
    ioServer = initSocket(server);
    app.set('io', ioServer);

    await new Promise((resolve) => {
      server.listen(0, () => {
        serverPort = server.address().port;
        resolve();
      });
    });

    // 2. Create Users
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Kanban Admin',
        email: `kanban.admin.${Date.now()}@test-kb.com`,
        password: 'Password123!',
        workspaceName: 'Kanban Sprint HQ',
      });
    adminToken = adminRes.body.data.accessToken;
    adminUser = adminRes.body.data.user;
    workspaceId = adminRes.body.data.workspace._id;

    const memberRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Kanban Member',
        email: `kanban.member.${Date.now()}@test-kb.com`,
        password: 'Password123!',
      });
    memberToken = memberRes.body.data.accessToken;
    memberUser = memberRes.body.data.user;

    await Membership.create({
      workspace: workspaceId,
      user: memberUser._id,
      role: 'MEMBER',
      status: 'ACTIVE',
    });

    const outsiderRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Kanban Outsider',
        email: `kanban.outsider.${Date.now()}@test-kb.com`,
        password: 'Password123!',
      });
    outsiderToken = outsiderRes.body.data.accessToken;
    outsiderUser = outsiderRes.body.data.user;

    // 3. Create Project
    const projRes = await request(app)
      .post(`/api/workspaces/${workspaceId}/projects`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Realtime Kanban Board Initiative',
        priority: 'HIGH',
      });
    projectId = projRes.body.data._id;

    // 4. Create Initial Tasks
    const t1 = await Task.create({
      workspace: workspaceId,
      project: projectId,
      title: 'Task A - Backlog Item',
      status: 'TODO',
      position: 1000,
      createdBy: adminUser._id,
    });
    task1Id = t1._id.toString();

    const t2 = await Task.create({
      workspace: workspaceId,
      project: projectId,
      title: 'Task B - Middle Item',
      status: 'TODO',
      position: 2000,
      createdBy: adminUser._id,
    });
    task2Id = t2._id.toString();

    const t3 = await Task.create({
      workspace: workspaceId,
      project: projectId,
      title: 'Task C - Bottom Item',
      status: 'TODO',
      position: 3000,
      createdBy: adminUser._id,
    });
    task3Id = t3._id.toString();
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
    if (mongoose.connection.readyState !== 0) {
      await User.deleteMany({ email: { $regex: '@test-kb\\.com$' } });
      if (workspaceId) {
        await Workspace.findByIdAndDelete(workspaceId);
        await Membership.deleteMany({ workspace: workspaceId });
        await Project.deleteMany({ workspace: workspaceId });
        await Task.deleteMany({ workspace: workspaceId });
        await ActivityLog.deleteMany({ workspace: workspaceId });
      }
      await mongoose.disconnect();
    }
  });

  describe('1. Kanban Reordering & Stable Position Strategy', () => {
    it('moves a task to another status column with explicit position (PATCH /tasks/:id/move)', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/${workspaceId}/tasks/${task1Id}/move`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          status: 'IN_PROGRESS',
          position: 1500,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('IN_PROGRESS');
      expect(res.body.data.position).toBe(1500);

      // Verify recorded in ActivityLog
      const log = await ActivityLog.findOne({
        entityId: task1Id,
        action: 'TASK_MOVED',
      });
      expect(log).toBeDefined();
      expect(log.metadata.to).toBe('IN_PROGRESS');
    });

    it('calculates intermediate floating position between two adjacent cards', async () => {
      // Move task3 between two hypothetical tasks: previous (1000) and next (2000)
      const res = await request(app)
        .patch(`/api/workspaces/${workspaceId}/tasks/${task3Id}/move`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          status: 'TODO',
          previousTaskId: task1Id, // position 1500 (from previous test)
          nextTaskId: task2Id,     // position 2000
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      // (1500 + 2000) / 2 = 1750
      expect(res.body.data.position).toBe(1750);
    });

    it('recalculates project progress when card is moved to DONE column', async () => {
      const res = await request(app)
        .patch(`/api/workspaces/${workspaceId}/tasks/${task1Id}/move`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          status: 'DONE',
          position: 1000,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('DONE');

      // 1 done out of 3 total tasks = 33%
      const project = await Project.findById(projectId);
      expect(project.progress).toBe(33);
    });
  });

  describe('2. Socket.IO Authentication & Security', () => {
    it('rejects socket connection without authentication token', async () => {
      const socket = ClientIO(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        auth: {},
      });

      const err = await new Promise((resolve) => {
        socket.on('connect_error', (error) => {
          resolve(error);
        });
      });

      expect(err).toBeDefined();
      expect(err.message).toMatch(/Token missing/i);
      socket.close();
    });

    it('rejects socket connection with invalid/tampered token', async () => {
      const socket = ClientIO(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        auth: { token: 'invalid-signature-token-sample' },
      });

      const err = await new Promise((resolve) => {
        socket.on('connect_error', (error) => {
          resolve(error);
        });
      });

      expect(err).toBeDefined();
      expect(err.message).toMatch(/Authentication error/i);
      socket.close();
    });

    it('allows socket connection with valid user token', async () => {
      const socket = ClientIO(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        auth: { token: memberToken },
      });

      const connected = await new Promise((resolve) => {
        socket.on('connect', () => {
          resolve(true);
        });
      });

      expect(connected).toBe(true);
      expect(socket.connected).toBe(true);
      socket.close();
    });
  });

  describe('3. Real-Time Rooms, Presence & Event Broadcasting', () => {
    let clientSocket1;
    let clientSocket2;

    afterEach(() => {
      if (clientSocket1?.connected) clientSocket1.close();
      if (clientSocket2?.connected) clientSocket2.close();
    });

    it('rejects unauthorized socket from joining workspace room', async () => {
      const outsiderSocket = ClientIO(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        auth: { token: outsiderToken },
      });

      await new Promise((resolve) => outsiderSocket.on('connect', resolve));

      const ack = await new Promise((resolve) => {
        outsiderSocket.emit('join:workspace', workspaceId, (response) => {
          resolve(response);
        });
      });

      expect(ack.success).toBe(false);
      expect(ack.error).toMatch(/Unauthorized/i);
      outsiderSocket.close();
    });

    it('allows authorized member to join workspace and broadcasts member:online', async () => {
      // Connect Admin socket
      clientSocket1 = ClientIO(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        auth: { token: adminToken },
      });
      await new Promise((resolve) => clientSocket1.on('connect', resolve));

      // Admin joins workspace
      await new Promise((resolve) => {
        clientSocket1.emit('join:workspace', workspaceId, resolve);
      });

      // Connect Member socket
      clientSocket2 = ClientIO(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        auth: { token: memberToken },
      });
      await new Promise((resolve) => clientSocket2.on('connect', resolve));

      // Set up listener on Admin socket for Member joining
      const onlinePromise = new Promise((resolve) => {
        clientSocket1.on('member:online', (data) => {
          resolve(data);
        });
      });

      // Member joins workspace
      clientSocket2.emit('join:workspace', workspaceId);

      const receivedEvent = await onlinePromise;
      expect(receivedEvent).toBeDefined();
      expect(receivedEvent.userId).toBe(memberUser._id);
      expect(receivedEvent.workspaceId).toBe(workspaceId);
    });

    it('broadcasts task:moved in real time across the workspace room when card is moved', async () => {
      // Connect Member socket and join workspace
      clientSocket1 = ClientIO(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        auth: { token: memberToken },
      });
      await new Promise((resolve) => clientSocket1.on('connect', resolve));
      await new Promise((resolve) => clientSocket1.emit('join:workspace', workspaceId, resolve));

      // Promise waiting for task:moved broadcast
      const taskMovedPromise = new Promise((resolve) => {
        clientSocket1.on('task:moved', (payload) => {
          resolve(payload);
        });
      });

      // Admin performs task move via REST API
      const res = await request(app)
        .patch(`/api/workspaces/${workspaceId}/tasks/${task2Id}/move`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'IN_REVIEW',
          position: 5000,
        });

      expect(res.statusCode).toBe(200);

      // Verify real-time socket received the event with updated status
      const socketPayload = await taskMovedPromise;
      expect(socketPayload).toBeDefined();
      expect(socketPayload.taskId).toBe(task2Id);
      expect(socketPayload.status).toBe('IN_REVIEW');
      expect(socketPayload.position).toBe(5000);
    });

    it('broadcasts comment:created in real time when new comment is posted', async () => {
      clientSocket1 = ClientIO(`http://localhost:${serverPort}`, {
        transports: ['websocket'],
        auth: { token: memberToken },
      });
      await new Promise((resolve) => clientSocket1.on('connect', resolve));
      await new Promise((resolve) => clientSocket1.emit('join:workspace', workspaceId, resolve));

      const commentPromise = new Promise((resolve) => {
        clientSocket1.on('comment:created', (payload) => {
          resolve(payload);
        });
      });

      // Post comment via REST API
      await request(app)
        .post(`/api/workspaces/${workspaceId}/tasks/${task2Id}/comments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: 'Live Socket.IO broadcast test comment',
        });

      const socketPayload = await commentPromise;
      expect(socketPayload).toBeDefined();
      expect(socketPayload.taskId).toBe(task2Id);
      expect(socketPayload.comment.content).toBe('Live Socket.IO broadcast test comment');
    });
  });
});
