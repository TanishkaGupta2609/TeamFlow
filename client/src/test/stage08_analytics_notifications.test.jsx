import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ToastProvider from '../components/ui/Toast';
import notificationReducer, {
  applyRealtimeNotification,
  markAllAsRead,
} from '../store/notificationSlice';
import analyticsReducer from '../store/analyticsSlice';
import workspaceReducer from '../store/workspaceSlice';
import projectReducer from '../store/projectSlice';
import taskReducer from '../store/taskSlice';
import authReducer from '../store/authSlice';
import { NotificationDropdown } from '../components/common/NotificationDropdown';
import { CalendarPage } from '../pages/CalendarPage';
import { ReportsPage } from '../pages/ReportsPage';

// Mock Socket.IO client module
vi.mock('../services/socket', () => ({
  getSocket: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  })),
  joinWorkspaceRoom: vi.fn(),
  leaveWorkspaceRoom: vi.fn(),
  connectSocketWithToken: vi.fn(),
  disconnectSocket: vi.fn(),
}));

const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      notification: notificationReducer,
      analytics: analyticsReducer,
      workspace: workspaceReducer,
      project: projectReducer,
      task: taskReducer,
      auth: authReducer,
    },
    preloadedState,
  });
};

const renderWithProviders = (component, store) => {
  return render(
    <Provider store={store}>
      <ToastProvider>
        {component}
      </ToastProvider>
    </Provider>
  );
};

describe('Stage 08: Notifications, Calendar and Analytics', () => {
  let store;

  beforeEach(() => {
    store = createTestStore({
      notification: {
        notifications: [
          {
            _id: 'notif_1',
            title: 'Task Assigned',
            message: 'You were assigned to Design System audit.',
            type: 'TASK_ASSIGNED',
            isRead: false,
            createdAt: new Date().toISOString(),
          },
          {
            _id: 'notif_2',
            title: 'Deadline Approaching',
            message: 'Release milestone is due within 24 hours.',
            type: 'DEADLINE_APPROACHING',
            isRead: true,
            createdAt: new Date().toISOString(),
          },
        ],
        unreadCount: 1,
        total: 2,
        page: 1,
        totalPages: 1,
        isLoading: false,
        error: null,
      },
      analytics: {
        data: {
          overview: {
            totalProjects: 6,
            activeProjects: 4,
            completedProjects: 2,
            overallProgress: 78,
            totalTasks: 50,
            completedTasks: 35,
            pendingTasks: 15,
            overdueTasks: 2,
            completionRate: 70,
          },
          statusDistribution: [
            { status: 'BACKLOG', label: 'Backlog', count: 5, color: '#94A3B8' },
            { status: 'TODO', label: 'To Do', count: 10, color: '#A9B8A5' },
            { status: 'IN_PROGRESS', label: 'In Progress', count: 15, color: '#173F35' },
            { status: 'IN_REVIEW', label: 'In Review', count: 5, color: '#D49A52' },
            { status: 'DONE', label: 'Done', count: 15, color: '#477A5B' },
          ],
          priorityDistribution: [
            { priority: 'LOW', label: 'Low', count: 10, color: '#477A5B' },
            { priority: 'MEDIUM', label: 'Medium', count: 20, color: '#285747' },
            { priority: 'HIGH', label: 'High', count: 15, color: '#D49A52' },
            { priority: 'CRITICAL', label: 'Critical', count: 5, color: '#C66A5A' },
          ],
          weeklyVelocity: [
            { week: 'Week 1', completed: 6 },
            { week: 'Week 2', completed: 10 },
            { week: 'Week 3', completed: 8 },
            { week: 'Week 4', completed: 11 },
          ],
          teamWorkload: [
            {
              memberId: 'm1',
              name: 'Liam Vance',
              role: 'Product Lead',
              email: 'liam@teamflow.com',
              avatar: '',
              assignedTasks: 12,
              completedTasks: 9,
              pendingTasks: 3,
              productivityRate: 75,
            },
          ],
          projectProgressChart: [
            { name: 'Core SaaS App', progress: 78, status: 'ACTIVE', priority: 'HIGH' },
          ],
        },
        isLoading: false,
        error: null,
      },
      workspace: {
        currentWorkspace: { _id: 'ws_stage08', name: 'Stage 08 Testing Corp' },
        workspaces: [],
        members: [],
        isLoading: false,
        error: null,
      },
      project: {
        projects: [{ _id: 'proj_1', name: 'Core SaaS App' }],
        isLoading: false,
        error: null,
      },
      task: {
        tasks: [
          {
            _id: 'task_cal_1',
            title: 'Prepare Stage 08 Verification',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            dueDate: '2026-11-14T10:00:00.000Z',
          },
        ],
        currentTaskDetails: null,
        isLoading: false,
        error: null,
      },
      auth: {
        user: { _id: 'u1', name: 'Stage 08 User' },
        token: 'fake_jwt_token',
      },
    });
  });

  describe('Notification Dropdown Component', () => {
    it('renders bell button with unread count badge', () => {
      renderWithProviders(<NotificationDropdown />, store);

      const bellBtn = screen.getByRole('button', { name: /view notifications/i });
      expect(bellBtn).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Unread count
    });

    it('opens dropdown and displays notifications list on click', () => {
      renderWithProviders(<NotificationDropdown />, store);

      const bellBtn = screen.getByRole('button', { name: /view notifications/i });
      fireEvent.click(bellBtn);

      expect(screen.getByRole('heading', { name: /notifications/i })).toBeInTheDocument();
      expect(screen.getByText(/Task Assigned/i)).toBeInTheDocument();
      expect(screen.getByText(/You were assigned to Design System audit/i)).toBeInTheDocument();
      expect(screen.getByText(/Deadline Approaching/i)).toBeInTheDocument();
    });

    it('filters between All and Unread notifications', () => {
      renderWithProviders(<NotificationDropdown />, store);

      const bellBtn = screen.getByRole('button', { name: /view notifications/i });
      fireEvent.click(bellBtn);

      const unreadTab = screen.getByRole('button', { name: /unread \(1\)/i });
      fireEvent.click(unreadTab);

      expect(screen.getByText(/Task Assigned/i)).toBeInTheDocument();
      expect(screen.queryByText(/Deadline Approaching/i)).not.toBeInTheDocument();
    });

    it('applies realtime notification to store and increments unread count', () => {
      store.dispatch(
        applyRealtimeNotification({
          _id: 'notif_realtime',
          title: 'Realtime Alert',
          message: 'Realtime socket test message',
          isRead: false,
          createdAt: new Date().toISOString(),
        })
      );

      const state = store.getState().notification;
      expect(state.unreadCount).toBe(2);
      expect(state.notifications.some((n) => n._id === 'notif_realtime')).toBe(true);
    });
  });

  describe('Delivery Calendar Page', () => {
    it('renders calendar header, month view, and navigation buttons', () => {
      renderWithProviders(<CalendarPage />, store);

      expect(screen.getByRole('heading', { level: 1, name: /delivery calendar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /month view/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /week view/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /day view/i })).toBeInTheDocument();
      expect(screen.getByText(/November 2026/i)).toBeInTheDocument();
    });

    it('switches views to Week View and Day View', () => {
      renderWithProviders(<CalendarPage />, store);

      const weekBtn = screen.getByRole('button', { name: /week view/i });
      fireEvent.click(weekBtn);
      expect(weekBtn).toHaveClass('text-forest');

      const dayBtn = screen.getByRole('button', { name: /day view/i });
      fireEvent.click(dayBtn);
      expect(dayBtn).toHaveClass('text-forest');
    });
  });

  describe('Analytics & Reports Dashboard Page', () => {
    it('renders analytics overview metric cards with real data', () => {
      renderWithProviders(<ReportsPage />, store);

      expect(screen.getByRole('heading', { level: 1, name: /analytics & reports/i })).toBeInTheDocument();
      expect(screen.getByText(/70%/i)).toBeInTheDocument(); // Completion rate
      expect(screen.getByText(/35 of 50 total tasks finished/i)).toBeInTheDocument();
      expect(screen.getByText(/Task Status Distribution/i)).toBeInTheDocument();
      expect(screen.getByText(/Weekly Task Velocity/i)).toBeInTheDocument();
      expect(screen.getByText(/Priority Distribution/i)).toBeInTheDocument();
    });

    it('renders Team Workload & Individual Productivity table with active members', () => {
      renderWithProviders(<ReportsPage />, store);

      expect(screen.getByText(/Team Workload & Individual Productivity/i)).toBeInTheDocument();
      expect(screen.getByText(/Liam Vance/i)).toBeInTheDocument();
      expect(screen.getByText(/Product Lead/i)).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument(); // Productivity rate
    });
  });
});
