import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// Fetch notifications
export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async ({ workspaceId, unreadOnly = false, page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (workspaceId) params.workspaceId = workspaceId;
      if (unreadOnly) params.unreadOnly = true;

      const response = await api.get('/notifications', { params });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

// Fetch unread count
export const fetchUnreadCount = createAsyncThunk(
  'notification/fetchUnreadCount',
  async (workspaceId, { rejectWithValue }) => {
    try {
      const params = workspaceId ? { workspaceId } : {};
      const response = await api.get('/notifications/unread-count', { params });
      return response.data.data.unreadCount;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch unread count');
    }
  }
);

// Mark single notification as read
export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark notification as read');
    }
  }
);

// Mark all as read
export const markAllAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (workspaceId, { rejectWithValue }) => {
    try {
      await api.patch('/notifications/read-all', { workspaceId });
      return workspaceId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark all as read');
    }
  }
);

// Delete notification
export const deleteNotification = createAsyncThunk(
  'notification/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      return notificationId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete notification');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    notifications: [],
    unreadCount: 0,
    total: 0,
    page: 1,
    totalPages: 1,
    isLoading: false,
    error: null,
  },
  reducers: {
    applyRealtimeNotification: (state, action) => {
      const notif = action.payload;
      if (!state.notifications.some((n) => n._id === notif._id)) {
        state.notifications.unshift(notif);
        if (!notif.isRead) {
          state.unreadCount += 1;
        }
      }
    },
    clearNotificationError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchNotifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.notifications || [];
        state.unreadCount = action.payload.unreadCount || 0;
        state.total = action.payload.total || 0;
        state.page = action.payload.page || 1;
        state.totalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // fetchUnreadCount
    builder.addCase(fetchUnreadCount.fulfilled, (state, action) => {
      state.unreadCount = action.payload || 0;
    });

    // markAsRead
    builder.addCase(markAsRead.fulfilled, (state, action) => {
      const index = state.notifications.findIndex((n) => n._id === action.payload._id);
      if (index !== -1) {
        if (!state.notifications[index].isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications[index] = action.payload;
      }
    });

    // markAllAsRead
    builder.addCase(markAllAsRead.fulfilled, (state) => {
      state.notifications.forEach((n) => {
        n.isRead = true;
      });
      state.unreadCount = 0;
    });

    // deleteNotification
    builder.addCase(deleteNotification.fulfilled, (state, action) => {
      const notif = state.notifications.find((n) => n._id === action.payload);
      if (notif && !notif.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter((n) => n._id !== action.payload);
    });
  },
});

export const { applyRealtimeNotification, clearNotificationError } = notificationSlice.actions;
export default notificationSlice.reducer;
