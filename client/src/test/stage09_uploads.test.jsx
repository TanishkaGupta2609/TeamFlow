import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ToastProvider from '../components/ui/Toast';
import taskReducer, {
  uploadTaskAttachments,
  deleteTaskAttachment,
  setCurrentTaskDetails,
} from '../store/taskSlice';
import authReducer, {
  uploadAvatar,
} from '../store/authSlice';
import workspaceReducer, {
  uploadWorkspaceLogo,
  setCurrentWorkspace,
} from '../store/workspaceSlice';
import projectReducer from '../store/projectSlice';
import notificationReducer from '../store/notificationSlice';
import analyticsReducer from '../store/analyticsSlice';
import { TaskDetailsModal } from '../components/kanban/TaskDetailsModal';
import { SettingsPage } from '../pages/SettingsPage';

// Mock Socket
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
      task: taskReducer,
      auth: authReducer,
      workspace: workspaceReducer,
      project: projectReducer,
      notification: notificationReducer,
      analytics: analyticsReducer,
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

describe('Stage 09: File Uploads, Task Attachments, and Assets', () => {
  let store;

  const mockTask = {
    _id: 'task_stage09_1',
    id: 'task_stage09_1',
    title: 'Design System Documentation',
    description: 'Upload PDF specs and brand guidelines.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    attachments: [
      {
        _id: 'att_1',
        name: 'Design_System_Spec.pdf',
        url: 'https://res.cloudinary.com/demo/image/upload/v1/spec.pdf',
        size: 1048576, // 1MB
        mimeType: 'application/pdf',
        createdAt: '2026-11-14T10:00:00.000Z',
      },
      {
        _id: 'att_2',
        name: 'brand_palette.png',
        url: 'https://res.cloudinary.com/demo/image/upload/v1/palette.png',
        size: 512000, // 500KB
        mimeType: 'image/png',
        createdAt: '2026-11-14T10:30:00.000Z',
      },
    ],
    subtasks: [],
    comments: [],
  };

  beforeEach(() => {
    store = createTestStore({
      auth: {
        user: {
          _id: 'user_stage09',
          name: 'Elena Rostova',
          email: 'elena@teamflow.test',
          avatar: 'https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg',
        },
        token: 'mock_token',
        isAuthenticated: true,
      },
      workspace: {
        currentWorkspace: {
          _id: 'ws_stage09',
          name: 'Design Org',
          slug: 'design-org',
          description: 'Global design system workspace',
          logo: 'https://res.cloudinary.com/demo/image/upload/v1/logo.png',
        },
        workspaces: [],
      },
      task: {
        tasks: [mockTask],
        currentTaskDetails: {
          task: mockTask,
          subtasks: [],
          comments: [],
          history: [],
        },
        isLoading: false,
        error: null,
      },
    });
  });

  it('renders TaskDetailsModal with Attachments tab and item count', () => {
    renderWithProviders(
      <TaskDetailsModal
        isOpen={true}
        onClose={vi.fn()}
        task={mockTask}
        workspaceId="ws_stage09"
      />,
      store
    );

    // Tab button should display Attachments with count
    const attachmentsTabBtn = screen.getByRole('button', { name: /Attachments \(2\)/i });
    expect(attachmentsTabBtn).toBeInTheDocument();
  });

  it('displays attachments list when Attachments tab is activated', () => {
    renderWithProviders(
      <TaskDetailsModal
        isOpen={true}
        onClose={vi.fn()}
        task={mockTask}
        workspaceId="ws_stage09"
      />,
      store
    );

    const attachmentsTabBtn = screen.getByRole('button', { name: /Attachments \(2\)/i });
    fireEvent.click(attachmentsTabBtn);

    expect(screen.getByText('Design_System_Spec.pdf')).toBeInTheDocument();
    expect(screen.getByText('brand_palette.png')).toBeInTheDocument();
    expect(screen.getByText(/1 MB/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload task files and documents/i)).toBeInTheDocument();
  });

  it('provides delete button for attachments inside TaskDetailsModal', () => {
    renderWithProviders(
      <TaskDetailsModal
        isOpen={true}
        onClose={vi.fn()}
        task={mockTask}
        workspaceId="ws_stage09"
      />,
      store
    );

    const attachmentsTabBtn = screen.getByRole('button', { name: /Attachments \(2\)/i });
    fireEvent.click(attachmentsTabBtn);

    const deleteBtn = screen.getByTestId('delete-attachment-att_1');
    expect(deleteBtn).toBeInTheDocument();
  });

  it('updates task attachments in redux store on uploadTaskAttachments.fulfilled', () => {
    const updatedAttachments = [
      ...mockTask.attachments,
      {
        _id: 'att_3',
        name: 'new_architecture.docx',
        url: 'https://res.cloudinary.com/demo/image/upload/v1/new_arch.docx',
        size: 204800,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    ];

    store.dispatch({
      type: uploadTaskAttachments.fulfilled.type,
      payload: updatedAttachments,
    });

    const state = store.getState().task;
    expect(state.currentTaskDetails.task.attachments).toHaveLength(3);
    expect(state.currentTaskDetails.task.attachments[2].name).toBe('new_architecture.docx');
  });

  it('removes attachment from redux store on deleteTaskAttachment.fulfilled', () => {
    store.dispatch({
      type: deleteTaskAttachment.fulfilled.type,
      payload: 'att_1',
    });

    const state = store.getState().task;
    expect(state.currentTaskDetails.task.attachments).toHaveLength(1);
    expect(state.currentTaskDetails.task.attachments[0]._id).toBe('att_2');
  });

  it('renders Profile Settings with Avatar upload input in SettingsPage', () => {
    renderWithProviders(<SettingsPage />, store);

    expect(screen.getByText('Profile Photo')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-file-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Change Photo/i })).toBeInTheDocument();
  });

  it('updates auth user avatar in redux store on uploadAvatar.fulfilled', () => {
    const newAvatarUrl = 'https://res.cloudinary.com/demo/image/upload/v2/new_avatar.png';

    store.dispatch({
      type: uploadAvatar.fulfilled.type,
      payload: { avatarUrl: newAvatarUrl },
    });

    const state = store.getState().auth;
    expect(state.user.avatar).toBe(newAvatarUrl);
  });

  it('renders Workspace Settings with Logo upload input in SettingsPage', () => {
    renderWithProviders(<SettingsPage />, store);

    // Click Workspace Settings Tab
    const wsTab = screen.getByRole('tab', { name: /Workspace Settings/i });
    fireEvent.click(wsTab);

    expect(screen.getByText('Workspace Logo')).toBeInTheDocument();
    expect(screen.getByTestId('workspace-logo-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upload Logo/i })).toBeInTheDocument();
  });

  it('updates workspace logo in redux store on uploadWorkspaceLogo.fulfilled', () => {
    const newLogoUrl = 'https://res.cloudinary.com/demo/image/upload/v2/new_logo.png';

    store.dispatch({
      type: uploadWorkspaceLogo.fulfilled.type,
      payload: { logoUrl: newLogoUrl },
    });

    const state = store.getState().workspace;
    expect(state.currentWorkspace.logo).toBe(newLogoUrl);
  });
});
