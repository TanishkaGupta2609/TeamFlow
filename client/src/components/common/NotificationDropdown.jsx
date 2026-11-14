import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Clock, 
  MessageSquare, 
  AlertCircle, 
  UserCheck, 
  FolderKanban, 
  Trash2,
  X
} from 'lucide-react';
import { 
  fetchNotifications, 
  fetchUnreadCount, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  applyRealtimeNotification 
} from '../../store/notificationSlice';
import { getSocket } from '../../services/socket';
import { useToast } from '../ui';

export const NotificationDropdown = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  const dropdownRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const { notifications, unreadCount, isLoading } = useSelector((state) => state.notification);
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const workspaceId = currentWorkspace?._id;

  // Fetch initial notifications and unread count
  useEffect(() => {
    dispatch(fetchNotifications({ workspaceId }));
    dispatch(fetchUnreadCount(workspaceId));
  }, [dispatch, workspaceId]);

  // Socket.IO real-time notification listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewNotification = (notification) => {
      dispatch(applyRealtimeNotification(notification));
      toast.info(notification.title || 'New Notification', notification.message);
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [dispatch, toast]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = (e, notifId) => {
    e.stopPropagation();
    dispatch(markAsRead(notifId));
  };

  const handleMarkAllAsRead = (e) => {
    e.stopPropagation();
    dispatch(markAllAsRead(workspaceId));
    toast.success('All Read', 'All notifications marked as read.');
  };

  const handleDelete = (e, notifId) => {
    e.stopPropagation();
    dispatch(deleteNotification(notifId));
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'TASK_ASSIGNED':
      case 'MEMBER_JOINED':
        return <UserCheck className="w-4 h-4 text-forest" />;
      case 'TASK_COMPLETED':
        return <Check className="w-4 h-4 text-status-success" />;
      case 'COMMENT_ADDED':
        return <MessageSquare className="w-4 h-4 text-forest" />;
      case 'DEADLINE_APPROACHING':
      case 'DEADLINE_ALERT':
        return <Clock className="w-4 h-4 text-amber-accent" />;
      case 'TASK_OVERDUE':
        return <AlertCircle className="w-4 h-4 text-status-danger" />;
      case 'PROJECT_INVITATION':
      case 'WORKSPACE_INVITATION':
        return <FolderKanban className="w-4 h-4 text-forest" />;
      default:
        return <Bell className="w-4 h-4 text-charcoal-secondary" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-charcoal-secondary hover:text-charcoal hover:bg-ivory transition-colors"
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-status-danger text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-border shadow-dropdown z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="p-3.5 border-b border-border flex items-center justify-between bg-ivory/50">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-xs text-charcoal uppercase tracking-wider">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-status-danger/10 text-status-danger text-[10px] font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-semibold text-forest hover:text-forest-dark flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-border bg-white px-3 pt-2 gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`pb-2 transition-colors border-b-2 ${
                filter === 'all'
                  ? 'border-forest text-forest'
                  : 'border-transparent text-charcoal-secondary hover:text-charcoal'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`pb-2 transition-colors border-b-2 ${
                filter === 'unread'
                  ? 'border-forest text-forest'
                  : 'border-transparent text-charcoal-secondary hover:text-charcoal'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 text-center text-xs text-charcoal-secondary/70">
                <Bell className="w-8 h-8 text-charcoal-secondary/30 mx-auto mb-2" />
                <p className="font-medium">No notifications</p>
                <p className="text-[11px] text-charcoal-secondary/50 mt-0.5">
                  {filter === 'unread' ? 'All caught up on unread alerts.' : 'No activity recorded yet.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n._id}
                  onClick={(e) => !n.isRead && handleMarkAsRead(e, n._id)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-ivory/50 transition-colors cursor-pointer group ${
                    !n.isRead ? 'bg-forest/5' : 'bg-white'
                  }`}
                >
                  <div className="p-1.5 bg-white rounded-lg border border-border shrink-0 shadow-subtle mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-xs leading-tight truncate ${!n.isRead ? 'font-bold text-charcoal' : 'font-medium text-charcoal'}`}>
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-charcoal-secondary shrink-0 font-mono">
                        {n.createdAt
                          ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Just now'}
                      </span>
                    </div>

                    <p className="text-[11px] text-charcoal-secondary mt-1 leading-snug line-clamp-2">
                      {n.message}
                    </p>
                  </div>

                  {/* Actions (Mark read / Delete) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(e, n._id)}
                        className="p-1 text-charcoal-secondary hover:text-forest rounded"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, n._id)}
                      className="p-1 text-charcoal-secondary hover:text-danger rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
