import mongoose from 'mongoose';
import { Project, Task, Subtask, Comment, Membership, ActivityLog } from '../models/index.js';

export class ProjectService {
  /**
   * Recalculates and persists project completion percentage.
   */
  static async recalculateProgress(projectId) {
    const totalTasks = await Task.countDocuments({ project: projectId });
    if (totalTasks === 0) {
      await Project.findByIdAndUpdate(projectId, { progress: 0 });
      return 0;
    }

    const doneTasks = await Task.countDocuments({ project: projectId, status: 'DONE' });
    const progress = Math.round((doneTasks / totalTasks) * 100);

    await Project.findByIdAndUpdate(projectId, { progress });
    return progress;
  }

  /**
   * Create a new project within a workspace.
   */
  static async createProject(workspaceId, actorUserId, projectData) {
    // Validate date constraints if both are provided
    if (projectData.startDate && projectData.dueDate) {
      const start = new Date(projectData.startDate);
      const due = new Date(projectData.dueDate);
      if (due < start) {
        const error = new Error('Project due date cannot be earlier than start date');
        error.statusCode = 400;
        throw error;
      }
    }

    // Validate members if provided
    let verifiedMembers = [actorUserId];
    if (projectData.members && Array.isArray(projectData.members)) {
      for (const memberId of projectData.members) {
        if (mongoose.Types.ObjectId.isValid(memberId)) {
          const isMember = await Membership.findOne({
            workspace: workspaceId,
            user: memberId,
            status: 'ACTIVE',
          });
          if (isMember && !verifiedMembers.some((m) => m.toString() === memberId.toString())) {
            verifiedMembers.push(memberId);
          }
        }
      }
    }

    // Validate manager if provided
    let manager = null;
    if (projectData.manager && mongoose.Types.ObjectId.isValid(projectData.manager)) {
      const isMember = await Membership.findOne({
        workspace: workspaceId,
        user: projectData.manager,
        status: 'ACTIVE',
      });
      if (isMember) {
        manager = projectData.manager;
      }
    }

    const project = await Project.create({
      workspace: workspaceId,
      name: projectData.name,
      description: projectData.description || '',
      color: projectData.color || '#173F35',
      startDate: projectData.startDate || null,
      dueDate: projectData.dueDate || null,
      status: projectData.status || 'PLANNING',
      priority: projectData.priority || 'MEDIUM',
      owner: actorUserId,
      manager: manager || actorUserId,
      members: verifiedMembers,
      progress: 0,
    });

    // Record ActivityLog
    await ActivityLog.create({
      workspace: workspaceId,
      actor: actorUserId,
      action: 'PROJECT_CREATED',
      entityType: 'PROJECT',
      entityId: project._id,
      metadata: { projectName: project.name },
    });

    return project;
  }

  /**
   * List projects for a workspace with filtering and progress.
   */
  static async getWorkspaceProjects(workspaceId, { status, priority, search, skip = 0, limit = 50, sort = '-createdAt' }) {
    const filter = { workspace: workspaceId };

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('owner', 'name email avatar')
        .populate('manager', 'name email avatar')
        .populate('members', 'name email avatar'),
      Project.countDocuments(filter),
    ]);

    return { projects, total };
  }

  /**
   * Get project details with task metrics.
   */
  static async getProjectDetails(workspaceId, projectId) {
    const project = await Project.findOne({
      _id: projectId,
      workspace: workspaceId,
    })
      .populate('owner', 'name email avatar')
      .populate('manager', 'name email avatar')
      .populate('members', 'name email avatar');

    if (!project) {
      const error = new Error('Project not found in this workspace');
      error.statusCode = 404;
      throw error;
    }

    const totalTasks = await Task.countDocuments({ project: projectId });
    const doneTasks = await Task.countDocuments({ project: projectId, status: 'DONE' });
    const inProgressTasks = await Task.countDocuments({ project: projectId, status: 'IN_PROGRESS' });
    const todoTasks = await Task.countDocuments({ project: projectId, status: 'TODO' });

    const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    project.progress = progress;
    await project.save();

    return {
      project,
      metrics: {
        totalTasks,
        doneTasks,
        inProgressTasks,
        todoTasks,
        progress,
      },
    };
  }

  /**
   * Update an existing project.
   */
  static async updateProject(workspaceId, projectId, actorUserId, updateData) {
    const project = await Project.findOne({ _id: projectId, workspace: workspaceId });
    if (!project) {
      const error = new Error('Project not found in this workspace');
      error.statusCode = 404;
      throw error;
    }

    // Check authorization: User must be workspace ADMIN or project owner/manager
    const membership = await Membership.findOne({
      workspace: workspaceId,
      user: actorUserId,
      status: 'ACTIVE',
    });
    const isAdmin = membership?.role === 'ADMIN';
    const isOwner = project.owner.toString() === actorUserId.toString();
    const isManager = project.manager && project.manager.toString() === actorUserId.toString();

    if (!isAdmin && !isOwner && !isManager) {
      const error = new Error('Forbidden: Only workspace admins, project owners, or project managers can edit this project');
      error.statusCode = 403;
      throw error;
    }

    // Validate dates if modified
    const start = updateData.startDate !== undefined ? updateData.startDate : project.startDate;
    const due = updateData.dueDate !== undefined ? updateData.dueDate : project.dueDate;
    if (start && due && new Date(due) < new Date(start)) {
      const error = new Error('Project due date cannot be earlier than start date');
      error.statusCode = 400;
      throw error;
    }

    if (updateData.name) project.name = updateData.name;
    if (updateData.description !== undefined) project.description = updateData.description;
    if (updateData.color) project.color = updateData.color;
    if (updateData.startDate !== undefined) project.startDate = updateData.startDate;
    if (updateData.dueDate !== undefined) project.dueDate = updateData.dueDate;
    if (updateData.status) project.status = updateData.status;
    if (updateData.priority) project.priority = updateData.priority;
    if (updateData.manager !== undefined) project.manager = updateData.manager;
    if (updateData.members) project.members = updateData.members;

    await project.save();

    // Record ActivityLog
    await ActivityLog.create({
      workspace: workspaceId,
      actor: actorUserId,
      action: 'PROJECT_UPDATED',
      entityType: 'PROJECT',
      entityId: project._id,
      metadata: { projectName: project.name, updatedFields: Object.keys(updateData) },
    });

    return project;
  }

  /**
   * Archive a project.
   */
  static async archiveProject(workspaceId, projectId, actorUserId) {
    const project = await this.updateProject(workspaceId, projectId, actorUserId, {
      status: 'ARCHIVED',
    });

    await ActivityLog.create({
      workspace: workspaceId,
      actor: actorUserId,
      action: 'PROJECT_ARCHIVED',
      entityType: 'PROJECT',
      entityId: project._id,
      metadata: { projectName: project.name },
    });

    return project;
  }

  /**
   * Delete project and cascade-remove its tasks, subtasks, and comments.
   */
  static async deleteProject(workspaceId, projectId, actorUserId) {
    const project = await Project.findOne({ _id: projectId, workspace: workspaceId });
    if (!project) {
      const error = new Error('Project not found in this workspace');
      error.statusCode = 404;
      throw error;
    }

    const membership = await Membership.findOne({
      workspace: workspaceId,
      user: actorUserId,
      status: 'ACTIVE',
    });
    const isAdmin = membership?.role === 'ADMIN';
    const isOwner = project.owner.toString() === actorUserId.toString();

    if (!isAdmin && !isOwner) {
      const error = new Error('Forbidden: Only workspace admins or project owners can delete this project');
      error.statusCode = 403;
      throw error;
    }

    // Find all task IDs for this project
    const tasks = await Task.find({ project: projectId }).select('_id');
    const taskIds = tasks.map((t) => t._id);

    await Promise.all([
      Project.findByIdAndDelete(projectId),
      Task.deleteMany({ project: projectId }),
      Subtask.deleteMany({ task: { $in: taskIds } }),
      Comment.deleteMany({ task: { $in: taskIds } }),
      ActivityLog.create({
        workspace: workspaceId,
        actor: actorUserId,
        action: 'PROJECT_DELETED',
        entityType: 'PROJECT',
        entityId: projectId,
        metadata: { projectName: project.name },
      }),
    ]);

    return { success: true };
  }
}

export default ProjectService;
