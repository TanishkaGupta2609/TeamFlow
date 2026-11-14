import mongoose from 'mongoose';
import { Project, Task, Membership, ActivityLog } from '../models/index.js';

export class AnalyticsService {
  /**
   * Calculate workspace analytics metrics directly from database collections.
   */
  static async getWorkspaceAnalytics(workspaceId) {
    const wsObjectId = new mongoose.Types.ObjectId(workspaceId);
    const now = new Date();

    // 1. Projects Metrics
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      planningProjects,
      onHoldProjects,
      projectsList,
    ] = await Promise.all([
      Project.countDocuments({ workspace: wsObjectId }),
      Project.countDocuments({ workspace: wsObjectId, status: 'ACTIVE' }),
      Project.countDocuments({ workspace: wsObjectId, status: 'COMPLETED' }),
      Project.countDocuments({ workspace: wsObjectId, status: 'PLANNING' }),
      Project.countDocuments({ workspace: wsObjectId, status: 'ON_HOLD' }),
      Project.find({ workspace: wsObjectId })
        .select('name status progress priority startDate endDate')
        .sort('-updatedAt')
        .limit(10),
    ]);

    // Average project progress
    const avgProgressResult = await Project.aggregate([
      { $match: { workspace: wsObjectId } },
      { $group: { _id: null, avgProgress: { $avg: '$progress' } } },
    ]);
    const overallProgress = Math.round(avgProgressResult[0]?.avgProgress || 0);

    // 2. Tasks Metrics
    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      inReviewTasks,
      todoTasks,
      backlogTasks,
      overdueTasks,
    ] = await Promise.all([
      Task.countDocuments({ workspace: wsObjectId }),
      Task.countDocuments({ workspace: wsObjectId, status: 'DONE' }),
      Task.countDocuments({ workspace: wsObjectId, status: 'IN_PROGRESS' }),
      Task.countDocuments({ workspace: wsObjectId, status: 'IN_REVIEW' }),
      Task.countDocuments({ workspace: wsObjectId, status: 'TODO' }),
      Task.countDocuments({ workspace: wsObjectId, status: 'BACKLOG' }),
      Task.countDocuments({
        workspace: wsObjectId,
        dueDate: { $lt: now },
        status: { $ne: 'DONE' },
      }),
    ]);

    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 3. Task Status Distribution
    const statusDistribution = [
      { status: 'BACKLOG', label: 'Backlog', count: backlogTasks, color: '#94A3B8' },
      { status: 'TODO', label: 'To Do', count: todoTasks, color: '#A9B8A5' },
      { status: 'IN_PROGRESS', label: 'In Progress', count: inProgressTasks, color: '#173F35' },
      { status: 'IN_REVIEW', label: 'In Review', count: inReviewTasks, color: '#D49A52' },
      { status: 'DONE', label: 'Done', count: completedTasks, color: '#477A5B' },
    ];

    // 4. Task Priority Distribution
    const priorityAgg = await Task.aggregate([
      { $match: { workspace: wsObjectId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const priorityMap = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    priorityAgg.forEach((item) => {
      if (item._id && priorityMap[item._id] !== undefined) {
        priorityMap[item._id] = item.count;
      }
    });

    const priorityDistribution = [
      { priority: 'LOW', label: 'Low', count: priorityMap.LOW, color: '#477A5B' },
      { priority: 'MEDIUM', label: 'Medium', count: priorityMap.MEDIUM, color: '#285747' },
      { priority: 'HIGH', label: 'High', count: priorityMap.HIGH, color: '#D49A52' },
      { priority: 'CRITICAL', label: 'Critical', count: priorityMap.CRITICAL, color: '#C66A5A' },
    ];

    // 5. Weekly Task Completion Velocity (Past 4 Weeks)
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    const weeklyCompletedTasks = await Task.aggregate([
      {
        $match: {
          workspace: wsObjectId,
          status: 'DONE',
          updatedAt: { $gte: fourWeeksAgo },
        },
      },
      {
        $group: {
          _id: { $week: '$updatedAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id': 1 } },
    ]);

    // Build standard 4-week timeline data
    const weeklyVelocity = [
      { week: 'Week 1', completed: weeklyCompletedTasks[0]?.count || 0 },
      { week: 'Week 2', completed: weeklyCompletedTasks[1]?.count || 0 },
      { week: 'Week 3', completed: weeklyCompletedTasks[2]?.count || 0 },
      { week: 'Week 4', completed: weeklyCompletedTasks[3]?.count || (completedTasks > 0 ? completedTasks : 0) },
    ];

    // 6. Team Workload & Individual Productivity
    const activeMembers = await Membership.find({
      workspace: wsObjectId,
      status: 'ACTIVE',
    }).populate('user', 'name email avatar designation');

    const teamWorkload = await Promise.all(
      activeMembers.map(async (m) => {
        const userId = m.user?._id;
        if (!userId) return null;

        const [assignedCount, userCompletedCount] = await Promise.all([
          Task.countDocuments({ workspace: wsObjectId, assignees: userId }),
          Task.countDocuments({ workspace: wsObjectId, assignees: userId, status: 'DONE' }),
        ]);

        const prodRate = assignedCount > 0 ? Math.round((userCompletedCount / assignedCount) * 100) : 100;

        return {
          memberId: userId,
          name: m.user?.name || 'Member',
          email: m.user?.email || '',
          avatar: m.user?.avatar || '',
          designation: m.user?.designation || m.role,
          role: m.role,
          assignedTasks: assignedCount,
          completedTasks: userCompletedCount,
          pendingTasks: assignedCount - userCompletedCount,
          productivityRate: prodRate,
        };
      })
    );

    const validTeamWorkload = teamWorkload.filter(Boolean);

    // 7. Project Progress Breakdown
    const projectProgressChart = projectsList.map((p) => ({
      name: p.name,
      progress: p.progress,
      status: p.status,
      priority: p.priority,
    }));

    return {
      overview: {
        totalProjects,
        activeProjects,
        completedProjects,
        planningProjects,
        onHoldProjects,
        overallProgress,
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        inReviewTasks,
        overdueTasks,
        completionRate,
      },
      statusDistribution,
      priorityDistribution,
      weeklyVelocity,
      teamWorkload: validTeamWorkload,
      projectProgressChart,
    };
  }
}

export default AnalyticsService;
