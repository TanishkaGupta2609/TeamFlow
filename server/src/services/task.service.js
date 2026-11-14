import mongoose from 'mongoose';
import { Task, Subtask, Comment, Project, Membership, ActivityLog } from '../models/index.js';
import { ProjectService } from './project.service.js';

export class TaskService {
  /**
   * Create a new task within a project and workspace.
   */
  static async createTask(workspaceId, projectId, actorUserId, taskData) {
    const project = await Project.findOne({ _id: projectId, workspace: workspaceId });
    if (!project) {
      const error = new Error('Project not found in this workspace');
      error.statusCode = 404;
      throw error;
    }

    // Verify assignees belong to workspace
    let verifiedAssignees = [];
    if (taskData.assignees && Array.isArray(taskData.assignees)) {
      for (const userId of taskData.assignees) {
        if (mongoose.Types.ObjectId.isValid(userId)) {
          const isMember = await Membership.findOne({
            workspace: workspaceId,
            user: userId,
            status: 'ACTIVE',
          });
          if (isMember) {
            verifiedAssignees.push(userId);
          }
        }
      }
    }

    // Determine position within status column if not given
    const status = taskData.status || 'TODO';
    let position = taskData.position;
    if (position === undefined) {
      const count = await Task.countDocuments({ project: projectId, status });
      position = count;
    }

    const task = await Task.create({
      workspace: workspaceId,
      project: projectId,
      title: taskData.title,
      description: taskData.description || '',
      status,
      priority: taskData.priority || 'MEDIUM',
      assignees: verifiedAssignees,
      createdBy: actorUserId,
      dueDate: taskData.dueDate || null,
      position,
      labels: taskData.labels || [],
      attachments: taskData.attachments || [],
    });

    // Update project progress
    await ProjectService.recalculateProgress(projectId);

    // Record ActivityLog
    await ActivityLog.create({
      workspace: workspaceId,
      actor: actorUserId,
      action: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: task._id,
      metadata: { taskTitle: task.title, projectId, status: task.status },
    });

    return task;
  }

  /**
   * List tasks for a workspace with rich filtering.
   */
  static async getWorkspaceTasks(workspaceId, { projectId, status, priority, assignee, search, skip = 0, limit = 100, sort = 'position' }) {
    const filter = { workspace: workspaceId };

    if (projectId) {
      filter.project = projectId;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }
    if (assignee && assignee !== 'all') {
      filter.assignees = assignee;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { labels: { $regex: search, $options: 'i' } },
      ];
    }

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('project', 'name color status')
        .populate('assignees', 'name email avatar designation')
        .populate('createdBy', 'name email avatar'),
      Task.countDocuments(filter),
    ]);

    return { tasks, total };
  }

  /**
   * Get detailed task information including subtasks, comments, and history.
   */
  static async getTaskDetails(workspaceId, taskId) {
    const task = await Task.findOne({ _id: taskId, workspace: workspaceId })
      .populate('project', 'name color status progress')
      .populate('assignees', 'name email avatar designation')
      .populate('createdBy', 'name email avatar');

    if (!task) {
      const error = new Error('Task not found in this workspace');
      error.statusCode = 404;
      throw error;
    }

    const [subtasks, comments, history] = await Promise.all([
      Subtask.find({ task: taskId }).sort('position createdAt'),
      Comment.find({ task: taskId }).sort('createdAt').populate('author', 'name email avatar designation'),
      ActivityLog.find({ entityId: taskId }).sort('-createdAt').limit(20).populate('actor', 'name avatar'),
    ]);

    return {
      task,
      subtasks,
      comments,
      history,
    };
  }

  /**
   * Update task fields, status transitions, and position.
   */
  static async updateTask(workspaceId, taskId, actorUserId, updateData) {
    const task = await Task.findOne({ _id: taskId, workspace: workspaceId });
    if (!task) {
      const error = new Error('Task not found in this workspace');
      error.statusCode = 404;
      throw error;
    }

    const oldStatus = task.status;
    const statusChanged = updateData.status && updateData.status !== oldStatus;

    if (updateData.title) task.title = updateData.title;
    if (updateData.description !== undefined) task.description = updateData.description;
    if (updateData.status) task.status = updateData.status;
    if (updateData.priority) task.priority = updateData.priority;
    if (updateData.dueDate !== undefined) task.dueDate = updateData.dueDate;
    if (updateData.labels) task.labels = updateData.labels;
    if (updateData.position !== undefined) task.position = updateData.position;

    // Verify assignees if updating
    if (updateData.assignees) {
      const validAssignees = [];
      for (const userId of updateData.assignees) {
        if (mongoose.Types.ObjectId.isValid(userId)) {
          const isMember = await Membership.findOne({
            workspace: workspaceId,
            user: userId,
            status: 'ACTIVE',
          });
          if (isMember) {
            validAssignees.push(userId);
          }
        }
      }
      task.assignees = validAssignees;
    }

    await task.save();

    // Recalculate progress if status changed
    if (statusChanged) {
      await ProjectService.recalculateProgress(task.project);
      await ActivityLog.create({
        workspace: workspaceId,
        actor: actorUserId,
        action: 'TASK_STATUS_CHANGED',
        entityType: 'TASK',
        entityId: task._id,
        metadata: { from: oldStatus, to: task.status, taskTitle: task.title },
      });
    } else {
      await ActivityLog.create({
        workspace: workspaceId,
        actor: actorUserId,
        action: 'TASK_UPDATED',
        entityType: 'TASK',
        entityId: task._id,
        metadata: { taskTitle: task.title, updatedFields: Object.keys(updateData) },
      });
    }

    return task;
  }

  /**
   * Delete a task and its subtasks/comments.
   */
  static async deleteTask(workspaceId, taskId, actorUserId) {
    const task = await Task.findOne({ _id: taskId, workspace: workspaceId });
    if (!task) {
      const error = new Error('Task not found in this workspace');
      error.statusCode = 404;
      throw error;
    }

    const projectId = task.project;

    await Promise.all([
      Task.findByIdAndDelete(taskId),
      Subtask.deleteMany({ task: taskId }),
      Comment.deleteMany({ task: taskId }),
      ActivityLog.create({
        workspace: workspaceId,
        actor: actorUserId,
        action: 'TASK_DELETED',
        entityType: 'TASK',
        entityId: taskId,
        metadata: { taskTitle: task.title },
      }),
    ]);

    // Recalculate project progress
    await ProjectService.recalculateProgress(projectId);

    return { success: true };
  }

  /**
   * Add a subtask.
   */
  static async createSubtask(workspaceId, taskId, subtaskData) {
    const task = await Task.findOne({ _id: taskId, workspace: workspaceId });
    if (!task) {
      const error = new Error('Task not found in this workspace');
      error.statusCode = 404;
      throw error;
    }

    const count = await Subtask.countDocuments({ task: taskId });
    const subtask = await Subtask.create({
      task: taskId,
      title: subtaskData.title,
      completed: false,
      assignedTo: subtaskData.assignedTo || null,
      position: count,
    });

    return subtask;
  }

  /**
   * Update subtask title or toggle completion.
   */
  static async updateSubtask(workspaceId, taskId, subtaskId, updateData) {
    const task = await Task.findOne({ _id: taskId, workspace: workspaceId });
    if (!task) {
      const error = new Error('Task not found in this workspace');
      error.statusCode = 404;
      throw error;
    }

    const subtask = await Subtask.findOne({ _id: subtaskId, task: taskId });
    if (!subtask) {
      const error = new Error('Subtask not found');
      error.statusCode = 404;
      throw error;
    }

    if (updateData.title !== undefined) subtask.title = updateData.title;
    if (updateData.completed !== undefined) subtask.completed = updateData.completed;
    if (updateData.assignedTo !== undefined) subtask.assignedTo = updateData.assignedTo;

    await subtask.save();
    return subtask;
  }

  /**
   * Delete a subtask.
   */
  static async deleteSubtask(workspaceId, taskId, subtaskId) {
    const task = await Task.findOne({ _id: taskId, workspace: workspaceId });
    if (!task) {
      const error = new Error('Task not found in this workspace');
      error.statusCode = 404;
      throw error;
    }

    await Subtask.findOneAndDelete({ _id: subtaskId, task: taskId });
    return { success: true };
  }

  /**
   * Add a comment to a task.
   */
  static async createComment(workspaceId, taskId, actorUserId, commentData) {
    const task = await Task.findOne({ _id: taskId, workspace: workspaceId });
    if (!task) {
      const error = new Error('Task not found in this workspace');
      error.statusCode = 404;
      throw error;
    }

    const comment = await Comment.create({
      workspace: workspaceId,
      task: taskId,
      author: actorUserId,
      content: commentData.content,
      attachments: commentData.attachments || [],
    });

    await ActivityLog.create({
      workspace: workspaceId,
      actor: actorUserId,
      action: 'COMMENT_ADDED',
      entityType: 'COMMENT',
      entityId: comment._id,
      metadata: { taskId, taskTitle: task.title },
    });

    return comment.populate('author', 'name email avatar designation');
  }

  /**
   * Get all comments for a task.
   */
  static async getTaskComments(workspaceId, taskId) {
    const task = await Task.findOne({ _id: taskId, workspace: workspaceId });
    if (!task) {
      const error = new Error('Task not found in this workspace');
      error.statusCode = 404;
      throw error;
    }

    const comments = await Comment.find({ task: taskId })
      .sort('createdAt')
      .populate('author', 'name email avatar designation');

    return comments;
  }
}

export default TaskService;
