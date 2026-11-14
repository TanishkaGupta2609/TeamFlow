import mongoose from 'mongoose';
import { Task, Project } from '../models/index.js';

export class CalendarService {
  /**
   * Get calendar events including task deadlines and project milestones.
   */
  static async getCalendarEvents(workspaceId, { startDate, endDate, projectId, assigneeId, priority } = {}) {
    const wsObjectId = new mongoose.Types.ObjectId(workspaceId);

    const taskFilter = {
      workspace: wsObjectId,
      dueDate: { $exists: true, $ne: null },
    };

    if (startDate && endDate) {
      taskFilter.dueDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (projectId && projectId !== 'all') {
      taskFilter.project = new mongoose.Types.ObjectId(projectId);
    }

    if (assigneeId && assigneeId !== 'all') {
      taskFilter.assignees = new mongoose.Types.ObjectId(assigneeId);
    }

    if (priority && priority !== 'all') {
      taskFilter.priority = priority.toUpperCase();
    }

    const projectFilter = {
      workspace: wsObjectId,
    };

    if (startDate && endDate) {
      projectFilter.$or = [
        { startDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
        { endDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
      ];
    }

    const [tasks, projects] = await Promise.all([
      Task.find(taskFilter)
        .populate('project', 'name color status progress')
        .populate('assignees', 'name email avatar designation')
        .sort('dueDate'),
      Project.find(projectFilter)
        .select('name status progress priority startDate endDate')
        .sort('endDate'),
    ]);

    return {
      tasks,
      projects,
    };
  }
}

export default CalendarService;
