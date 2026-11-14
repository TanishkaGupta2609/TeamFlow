import cron from 'node-cron';
import { Task, Project, User } from '../models/index.js';
import { NotificationService } from './notification.service.js';

export class CronService {
  /**
   * Run deadline reminders and overdue alerts idempotently.
   */
  static async runDeadlineReminderJob() {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const results = {
      approachingTasks: 0,
      overdueTasks: 0,
      approachingProjects: 0,
    };

    try {
      // 1. Upcoming task reminders (due within 24 hours, not DONE)
      const approachingTasks = await Task.find({
        dueDate: { $gte: now, $lte: in24Hours },
        status: { $ne: 'DONE' },
      });

      for (const task of approachingTasks) {
        if (task.assignees && task.assignees.length > 0) {
          for (const assigneeId of task.assignees) {
            const key = `remind:approaching:${task._id}:${assigneeId}:${todayStr}`;
            await NotificationService.createNotification({
              recipient: assigneeId,
              workspace: task.workspace,
              type: 'DEADLINE_APPROACHING',
              title: 'Task Deadline Approaching',
              message: `Task "${task.title}" is due within 24 hours.`,
              relatedEntity: { entityType: 'TASK', entityId: task._id },
              idempotencyKey: key,
            });
            results.approachingTasks++;
          }
        }
      }

      // 2. Overdue task alerts (dueDate in the past, not DONE)
      const overdueTasks = await Task.find({
        dueDate: { $lt: now },
        status: { $ne: 'DONE' },
      });

      for (const task of overdueTasks) {
        if (task.assignees && task.assignees.length > 0) {
          for (const assigneeId of task.assignees) {
            const key = `remind:overdue:${task._id}:${assigneeId}:${todayStr}`;
            await NotificationService.createNotification({
              recipient: assigneeId,
              workspace: task.workspace,
              type: 'TASK_OVERDUE',
              title: 'Task Overdue Alert',
              message: `Task "${task.title}" has passed its due date and remains incomplete.`,
              relatedEntity: { entityType: 'TASK', entityId: task._id },
              idempotencyKey: key,
            });
            results.overdueTasks++;
          }
        }
      }

      // 3. Project deadline reminders (endDate within 48 hours, not COMPLETED or ARCHIVED)
      const approachingProjects = await Project.find({
        endDate: { $gte: now, $lte: in48Hours },
        status: { $nin: ['COMPLETED', 'ARCHIVED'] },
      });

      for (const project of approachingProjects) {
        const targetRecipient = project.manager || project.owner;
        if (targetRecipient) {
          const key = `remind:project:${project._id}:${targetRecipient}:${todayStr}`;
          await NotificationService.createNotification({
            recipient: targetRecipient,
            workspace: project.workspace,
            type: 'DEADLINE_APPROACHING',
            title: 'Project Deadline Approaching',
            message: `Project "${project.name}" target completion date is approaching.`,
            relatedEntity: { entityType: 'PROJECT', entityId: project._id },
            idempotencyKey: key,
          });
          results.approachingProjects++;
        }
      }
    } catch (err) {
      console.error('[CronService] Error executing deadline reminder job:', err.message);
    }

    return results;
  }

  /**
   * Initialize background cron jobs (runs every hour in production).
   */
  static initCronJobs() {
    // Run every hour: at minute 0
    const task = cron.schedule('0 * * * *', async () => {
      console.log('[CronService] Executing scheduled deadline check...');
      await CronService.runDeadlineReminderJob();
    });

    console.log('[CronService] Background reminder schedulers registered.');
    return task;
  }
}

export default CronService;
