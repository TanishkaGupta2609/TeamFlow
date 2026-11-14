import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ToastProvider from '../components/ui/Toast';
import authReducer from '../store/authSlice';
import workspaceReducer from '../store/workspaceSlice';
import projectReducer from '../store/projectSlice';
import taskReducer from '../store/taskSlice';
import notificationReducer from '../store/notificationSlice';
import analyticsReducer from '../store/analyticsSlice';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { ProjectsPage } from '../pages/ProjectsPage';
import { TasksPage } from '../pages/TasksPage';

// Mock Socket.IO client
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
      auth: authReducer,
      workspace: workspaceReducer,
      project: projectReducer,
      task: taskReducer,
      notification: notificationReducer,
      analytics: analyticsReducer,
    },
    preloadedState,
  });
};

const renderWithProviders = (component, store, { route = '/' } = {}) => {
  return render(
    <Provider store={store}>
      <ToastProvider>
        <MemoryRouter initialEntries={[route]}>
          {component}
        </MemoryRouter>
      </ToastProvider>
    </Provider>
  );
};

describe('Stage 10: Frontend Testing, Form Validations & Access Safeguards', () => {
  let store;

  beforeEach(() => {
    localStorage.clear();
    store = createTestStore({
      auth: {
        user: {
          _id: 'user_stage10',
          name: 'Sarah Connor',
          email: 'sarah@teamflow.test',
        },
        token: 'valid_mock_jwt_token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
      workspace: {
        currentWorkspace: {
          _id: 'ws_stage10',
          name: 'Cyberdyne Systems',
          slug: 'cyberdyne',
        },
        workspaces: [],
      },
      project: {
        projects: [
          {
            _id: 'proj_stage10_1',
            name: 'Defense Network Overhaul',
            key: 'DNO',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            progress: 65,
            tasksCount: 12,
            completedTasksCount: 8,
            workspace: 'ws_stage10',
          },
        ],
        isLoading: false,
        error: null,
      },
      task: {
        tasks: [
          {
            _id: 'task_stage10_1',
            title: 'Verify Neural Processor Core',
            status: 'TODO',
            priority: 'CRITICAL',
            project: { _id: 'proj_stage10_1', name: 'Defense Network Overhaul' },
            workspace: 'ws_stage10',
            subtasks: [],
            comments: [],
            attachments: [],
          },
          {
            _id: 'task_stage10_2',
            title: 'Audit Network Encryption Protocols',
            status: 'DONE',
            priority: 'MEDIUM',
            project: { _id: 'proj_stage10_1', name: 'Defense Network Overhaul' },
            workspace: 'ws_stage10',
            subtasks: [],
            comments: [],
            attachments: [],
          },
        ],
        isLoading: false,
        error: null,
      },
    });
  });

  describe('1. Login Form Validations & Interactions', () => {
    it('validates empty email and password inputs before submit', async () => {
      renderWithProviders(<LoginPage />, store);

      const emailInput = screen.getByLabelText(/Work Email/i);
      const passwordInput = screen.getByPlaceholderText(/Enter your account password/i);
      const submitBtn = screen.getByRole('button', { name: /Sign In/i });

      // Clear default values
      fireEvent.change(emailInput, { target: { value: '' } });
      fireEvent.change(passwordInput, { target: { value: '' } });
      fireEvent.click(submitBtn);

      expect(await screen.findByText(/Email address is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/Password is required/i)).toBeInTheDocument();
    });

    it('renders server authentication error alert when error exists in store', () => {
      const errorStore = createTestStore({
        auth: {
          user: null,
          isAuthenticated: false,
          error: 'Invalid email or password credentials',
        },
      });

      renderWithProviders(<LoginPage />, errorStore);

      expect(screen.getByText(/Invalid email or password credentials/i)).toBeInTheDocument();
    });
  });

  describe('2. Registration Form Validations', () => {
    it('enforces required name, email, workspace name, password length, and terms acceptance', async () => {
      renderWithProviders(<RegisterPage />, store);

      const submitBtn = screen.getByRole('button', { name: /Create Workspace/i });
      fireEvent.click(submitBtn);

      expect(await screen.findByText(/Full name is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/Work email is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/Organization \/ Workspace name is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
      expect(await screen.findByText(/You must accept the terms of service/i)).toBeInTheDocument();
    });
  });

  describe('3. Route Guard & Protected Route Access Safeguards', () => {
    it('redirects unauthenticated users to /login and blocks private view', () => {
      const unauthStore = createTestStore({
        auth: {
          user: null,
          token: null,
          isAuthenticated: false,
        },
      });

      const { container } = renderWithProviders(
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div data-testid="protected-content">Top Secret Area</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Screen Redirected</div>} />
        </Routes>,
        unauthStore,
        { route: '/dashboard' }
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByText(/Login Screen Redirected/i)).toBeInTheDocument();
    });

    it('grants access to protected route when authenticated', () => {
      renderWithProviders(
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div data-testid="protected-content">Top Secret Area</div>
              </ProtectedRoute>
            }
          />
        </Routes>,
        store,
        { route: '/dashboard' }
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('4. Project Management & Creation Modal Validation', () => {
    it('opens Create Project modal on button click and provides project inputs', async () => {
      renderWithProviders(<ProjectsPage />, store);

      expect(screen.getByText('Defense Network Overhaul')).toBeInTheDocument();

      const createBtn = screen.getByRole('button', { name: /Create Project/i });
      fireEvent.click(createBtn);

      expect(screen.getByText('Create New Project')).toBeInTheDocument();
      expect(screen.getByLabelText(/Project Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Project Key/i)).toBeInTheDocument();
    });
  });

  describe('5. Task Management, Filtering & Search', () => {
    it('renders tasks and filters tasks by search query', async () => {
      renderWithProviders(<TasksPage />, store);

      expect(screen.getByText('Verify Neural Processor Core')).toBeInTheDocument();
      expect(screen.getByText('Audit Network Encryption Protocols')).toBeInTheDocument();

      const searchInput = screen.getByPlaceholderText(/Search tasks\.\.\./i);
      fireEvent.change(searchInput, { target: { value: 'Neural Processor' } });

      expect(screen.getByText('Verify Neural Processor Core')).toBeInTheDocument();
      expect(screen.queryByText('Audit Network Encryption Protocols')).not.toBeInTheDocument();
    });

    it('opens Create Task modal when Create Task button is triggered', () => {
      renderWithProviders(<TasksPage />, store);

      const newTaskBtn = screen.getByRole('button', { name: /Create Task/i });
      fireEvent.click(newTaskBtn);

      expect(screen.getByText('Create New Task')).toBeInTheDocument();
      expect(screen.getByLabelText(/Task Summary/i)).toBeInTheDocument();
    });
  });
});
