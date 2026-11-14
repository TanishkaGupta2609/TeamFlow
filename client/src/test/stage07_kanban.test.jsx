import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ToastProvider from '../components/ui/Toast';
import taskReducer, {
  moveTaskOptimistic,
  applyRealtimeTaskCreated,
  applyRealtimeTaskUpdated,
  applyRealtimeTaskMoved,
  applyRealtimeTaskDeleted,
  applyRealtimeCommentCreated,
} from '../store/taskSlice';
import workspaceReducer from '../store/workspaceSlice';
import projectReducer from '../store/projectSlice';
import authReducer from '../store/authSlice';
import { KanbanPage } from '../pages/KanbanPage';

// Mock Socket.IO client module
vi.mock('../services/socket', () => ({
  getSocket: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  })),
  joinWorkspaceRoom: vi.fn((wsId, cb) => cb && cb(['user_1', 'user_2'])),
  leaveWorkspaceRoom: vi.fn(),
  connectSocketWithToken: vi.fn(),
  disconnectSocket: vi.fn(),
}));

const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      task: taskReducer,
      workspace: workspaceReducer,
      project: projectReducer,
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

describe('Stage 07: Kanban Board & Real-Time Collaboration', () => {
  let store;

  beforeEach(() => {
    store = createTestStore({
      task: {
        tasks: [
          {
            _id: 'task_1',
            title: 'Design high-converting landing page',
            status: 'TODO',
            priority: 'HIGH',
            position: 1000,
            dueDate: '2026-11-20',
            subtasks: [{ _id: 'st_1', title: 'Draft wireframes', completed: true }],
            comments: [],
            commentCount: 2,
            attachmentCount: 1,
            assignees: [{ _id: 'u1', name: 'Liam Vance' }],
          },
          {
            _id: 'task_2',
            title: 'Implement Socket.IO room broadcast',
            status: 'IN_PROGRESS',
            priority: 'CRITICAL',
            position: 2000,
            subtasks: [],
            comments: [],
            commentCount: 0,
            assignees: [],
          },
        ],
        currentTaskDetails: null,
        isLoading: false,
        error: null,
      },
      workspace: {
        currentWorkspace: { _id: 'ws_test_123', name: 'Acme SaaS' },
        workspaces: [],
        members: [{ user: { _id: 'u1', name: 'Liam Vance' } }],
        isLoading: false,
        error: null,
      },
      project: {
        projects: [{ _id: 'proj_1', name: 'Web App Redesign' }],
        isLoading: false,
        error: null,
      },
      auth: {
        user: { _id: 'u1', name: 'Liam Vance' },
        token: 'fake_jwt_token',
      },
    });
  });

  it('renders Kanban board with 5 status columns and Live Sync indicator', () => {
    renderWithProviders(<KanbanPage />, store);

    // Board Header
    expect(screen.getByRole('heading', { level: 1, name: /kanban board/i })).toBeInTheDocument();
    expect(screen.getByText(/Live Sync/i)).toBeInTheDocument();

    // 5 Columns
    expect(screen.getAllByText(/Backlog/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/To Do/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/In Progress/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/In Review/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Done/i).length).toBeGreaterThan(0);

    // Rendered tasks
    expect(screen.getByText(/Design high-converting landing page/i)).toBeInTheDocument();
    expect(screen.getByText(/Implement Socket.IO room broadcast/i)).toBeInTheDocument();
  });

  it('filters tasks by search input', () => {
    renderWithProviders(<KanbanPage />, store);

    const searchInput = screen.getByPlaceholderText(/filter tasks by title or keyword/i);
    fireEvent.change(searchInput, { target: { value: 'Socket.IO' } });

    expect(screen.getByText(/Implement Socket.IO room broadcast/i)).toBeInTheDocument();
    expect(screen.queryByText(/Design high-converting landing page/i)).not.toBeInTheDocument();
  });

  it('opens Create Task modal when Add Task button is clicked', () => {
    renderWithProviders(<KanbanPage />, store);

    const addButtons = screen.getAllByRole('button', { name: /add task/i });
    fireEvent.click(addButtons[0]);

    expect(screen.getByRole('heading', { name: /create new task/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/task title/i)).toBeInTheDocument();
  });

  it('opens Task Details modal when task card is clicked', () => {
    renderWithProviders(<KanbanPage />, store);

    const taskCard = screen.getByText(/Design high-converting landing page/i);
    fireEvent.click(taskCard);

    // Modal opens showing task details
    expect(screen.getByRole('button', { name: /delete task/i })).toBeInTheDocument();
    expect(screen.getByText(/Draft wireframes/i)).toBeInTheDocument();
  });

  describe('Real-Time Redux Reducers', () => {
    it('applies optimistic move correctly', () => {
      store.dispatch(moveTaskOptimistic({ taskId: 'task_1', status: 'DONE', position: 5000 }));
      const updated = store.getState().task.tasks.find((t) => t._id === 'task_1');
      expect(updated.status).toBe('DONE');
      expect(updated.position).toBe(5000);
    });

    it('applies realtime task:created broadcast', () => {
      const newTask = {
        _id: 'task_3',
        title: 'New Socket Created Task',
        status: 'BACKLOG',
        priority: 'MEDIUM',
      };
      store.dispatch(applyRealtimeTaskCreated(newTask));
      expect(store.getState().task.tasks.some((t) => t._id === 'task_3')).toBe(true);
    });

    it('applies realtime task:updated broadcast', () => {
      store.dispatch(
        applyRealtimeTaskUpdated({
          _id: 'task_1',
          title: 'Updated Task Title Realtime',
        })
      );
      const updated = store.getState().task.tasks.find((t) => t._id === 'task_1');
      expect(updated.title).toBe('Updated Task Title Realtime');
    });

    it('applies realtime task:moved broadcast', () => {
      store.dispatch(
        applyRealtimeTaskMoved({
          taskId: 'task_2',
          status: 'DONE',
          position: 9000,
        })
      );
      const moved = store.getState().task.tasks.find((t) => t._id === 'task_2');
      expect(moved.status).toBe('DONE');
      expect(moved.position).toBe(9000);
    });

    it('applies realtime task:deleted broadcast', () => {
      store.dispatch(applyRealtimeTaskDeleted({ taskId: 'task_1' }));
      expect(store.getState().task.tasks.some((t) => t._id === 'task_1')).toBe(false);
    });

    it('applies realtime comment:created broadcast', () => {
      store.dispatch(
        applyRealtimeCommentCreated({
          taskId: 'task_2',
          comment: { _id: 'comm_1', content: 'Socket comment' },
        })
      );
      const task = store.getState().task.tasks.find((t) => t._id === 'task_2');
      expect(task.commentCount).toBe(1);
    });
  });
});
