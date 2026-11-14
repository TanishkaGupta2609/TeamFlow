import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import {
  User,
  Workspace,
  Membership,
  Invitation,
  Project,
  Task,
  Subtask,
  Comment,
  Notification,
  ActivityLog,
  RefreshSession,
} from '../src/models/index.js';
import { config } from '../src/config/env.js';

describe('Stage 03: Database Models & Architecture Verification', () => {
  beforeAll(async () => {
    // Attempt connection or verify schema without live DB if disconnected
    if (mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(config.mongodbUri, { serverSelectionTimeoutMS: 2000 });
      } catch (err) {
        // Fallback for isolated unit testing
      }
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  it('compiles all 11 Mongoose models without syntax or reference errors', () => {
    expect(User).toBeDefined();
    expect(Workspace).toBeDefined();
    expect(Membership).toBeDefined();
    expect(Invitation).toBeDefined();
    expect(Project).toBeDefined();
    expect(Task).toBeDefined();
    expect(Subtask).toBeDefined();
    expect(Comment).toBeDefined();
    expect(Notification).toBeDefined();
    expect(ActivityLog).toBeDefined();
    expect(RefreshSession).toBeDefined();
  });

  describe('User Model', () => {
    it('validates required fields (name, email, passwordHash)', () => {
      const user = new User({});
      const err = user.validateSync();
      expect(err.errors.name).toBeDefined();
      expect(err.errors.email).toBeDefined();
      expect(err.errors.passwordHash).toBeDefined();
    });

    it('sanitizes and strips passwordHash in JSON transform', () => {
      const user = new User({
        name: 'Tanishka Gupta',
        email: 'tanishka@teamflow.io',
        passwordHash: '$2a$12$securepasswordhashvalue',
      });
      const json = user.toJSON();
      expect(json.passwordHash).toBeUndefined();
      expect(json.name).toBe('Tanishka Gupta');
    });

    it('rejects invalid email formats', () => {
      const user = new User({
        name: 'Test',
        email: 'invalid-email-address',
        passwordHash: 'hash',
      });
      const err = user.validateSync();
      expect(err.errors.email).toBeDefined();
    });
  });

  describe('Workspace Model', () => {
    it('enforces required slug format (alphanumeric and dashes only)', () => {
      const invalidWs = new Workspace({
        name: 'My Workspace',
        slug: 'INVALID SLUG @#$',
        owner: new mongoose.Types.ObjectId(),
      });
      const err = invalidWs.validateSync();
      expect(err.errors.slug).toBeDefined();
    });

    it('accepts valid workspace attributes', () => {
      const validWs = new Workspace({
        name: 'TeamFlow HQ',
        slug: 'teamflow-hq',
        owner: new mongoose.Types.ObjectId(),
      });
      const err = validWs.validateSync();
      expect(err).toBeUndefined();
    });
  });

  describe('Membership Model', () => {
    it('enforces valid role enum [ADMIN, MANAGER, MEMBER]', () => {
      const mem = new Membership({
        workspace: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        role: 'SUPERADMIN', // Invalid role
      });
      const err = mem.validateSync();
      expect(err.errors.role).toBeDefined();
    });

    it('defaults role to MEMBER and status to ACTIVE', () => {
      const mem = new Membership({
        workspace: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
      });
      expect(mem.role).toBe('MEMBER');
      expect(mem.status).toBe('ACTIVE');
    });
  });

  describe('Task & Subtask Models', () => {
    it('enforces task status enums and position order', () => {
      const task = new Task({
        workspace: new mongoose.Types.ObjectId(),
        project: new mongoose.Types.ObjectId(),
        title: 'Build Kanban Board',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        createdBy: new mongoose.Types.ObjectId(),
        position: 1,
      });
      const err = task.validateSync();
      expect(err).toBeUndefined();
      expect(task.status).toBe('IN_PROGRESS');
      expect(task.priority).toBe('URGENT');
    });

    it('links subtask to parent task', () => {
      const subtask = new Subtask({
        task: new mongoose.Types.ObjectId(),
        title: 'Write unit tests',
        completed: false,
      });
      const err = subtask.validateSync();
      expect(err).toBeUndefined();
      expect(subtask.completed).toBe(false);
    });
  });

  describe('Invitation & RefreshSession TTL Indexes', () => {
    it('defines TTL expiration index on Invitation and RefreshSession', () => {
      const invIndexes = Invitation.schema.indexes();
      const hasTtl = invIndexes.some((idx) => idx[1] && idx[1].expireAfterSeconds === 0);
      expect(hasTtl).toBe(true);

      const sessIndexes = RefreshSession.schema.indexes();
      const hasSessTtl = sessIndexes.some((idx) => idx[1] && idx[1].expireAfterSeconds === 0);
      expect(hasSessTtl).toBe(true);
    });
  });
});
