import { asyncHandler, sendSuccess } from '../utils/index.js';
import { NotificationService } from '../services/notification.service.js';

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Protected
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const { workspaceId, unreadOnly, page, limit } = req.query;
  const result = await NotificationService.getUserNotifications(req.user._id, workspaceId, {
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 20,
    unreadOnly: unreadOnly === 'true',
  });
  return sendSuccess(res, result, 'Notifications retrieved successfully');
});

/**
 * @desc    Get unread notifications count
 * @route   GET /api/notifications/unread-count
 * @access  Protected
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const { workspaceId } = req.query;
  const count = await NotificationService.getUnreadCount(req.user._id, workspaceId);
  return sendSuccess(res, { unreadCount: count }, 'Unread count retrieved successfully');
});

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Protected
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await NotificationService.markAsRead(req.user._id, req.params.id);
  return sendSuccess(res, notification, 'Notification marked as read');
});

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/notifications/read-all
 * @access  Protected
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const { workspaceId } = req.body;
  const result = await NotificationService.markAllAsRead(req.user._id, workspaceId);
  return sendSuccess(res, result, 'All notifications marked as read');
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Protected
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  await NotificationService.deleteNotification(req.user._id, req.params.id);
  return sendSuccess(res, null, 'Notification deleted successfully');
});
