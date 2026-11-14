import mongoose from 'mongoose';
import { Notification, Membership } from '../models/index.js';
import { broadcastToUser } from '../socket/index.js';

export class NotificationService {
  /**
   * Create an idempotent notification and dispatch in real-time.
   */
  static async createNotification({
    recipient,
    workspace,
    type,
    title,
    message,
    relatedEntity,
    idempotencyKey,
  }) {
    if (!recipient || !workspace || !title || !message) {
      throw new Error('Missing required notification fields');
    }

    // Check idempotency if key provided
    if (idempotencyKey) {
      const existing = await Notification.findOne({ idempotencyKey });
      if (existing) {
        return existing;
      }
    }

    try {
      const notification = await Notification.create({
        recipient,
        workspace,
        type: type || 'SYSTEM',
        title,
        message,
        relatedEntity,
        idempotencyKey,
        isRead: false,
      });

      // Real-time broadcast to user's socket room
      broadcastToUser(recipient.toString(), 'notification:new', notification);

      return notification;
    } catch (err) {
      // If concurrent insertion hit unique idempotency key, return existing
      if (err.code === 11000 && idempotencyKey) {
        return await Notification.findOne({ idempotencyKey });
      }
      throw err;
    }
  }

  /**
   * Get paginated notifications for user.
   */
  static async getUserNotifications(userId, workspaceId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const filter = { recipient: userId };
    if (workspaceId) {
      filter.workspace = workspaceId;
    }
    if (unreadOnly) {
      filter.isRead = false;
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .populate('workspace', 'name logo'),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: userId, ...(workspaceId && { workspace: workspaceId }), isRead: false }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page: Number(page),
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get unread notifications count for user.
   */
  static async getUnreadCount(userId, workspaceId) {
    const filter = { recipient: userId, isRead: false };
    if (workspaceId) {
      filter.workspace = workspaceId;
    }
    return await Notification.countDocuments(filter);
  }

  /**
   * Mark a single notification as read.
   */
  static async markAsRead(userId, notificationId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }

    notification.isRead = true;
    await notification.save();

    return notification;
  }

  /**
   * Mark all notifications as read for a user.
   */
  static async markAllAsRead(userId, workspaceId) {
    const filter = { recipient: userId, isRead: false };
    if (workspaceId) {
      filter.workspace = workspaceId;
    }

    const result = await Notification.updateMany(filter, { $set: { isRead: true } });
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Delete a notification.
   */
  static async deleteNotification(userId, notificationId) {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }

    return { success: true };
  }
}

export default NotificationService;
