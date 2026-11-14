import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import { mockTasks } from '../services/mockData';

// Fetch tasks for workspace/project
export const fetchTasks = createAsyncThunk(
  'task/fetchTasks',
  async ({ workspaceId, projectId, status, priority, assignee, search }, { rejectWithValue }) => {
    try {
      const params = {};
      if (projectId) params.projectId = projectId;
      if (status && status !== 'all') params.status = status;
      if (priority && priority !== 'all') params.priority = priority;
      if (assignee && assignee !== 'all') params.assignee = assignee;
      if (search) params.search = search;

      const response = await api.get(`/workspaces/${workspaceId}/tasks`, { params });
      return response.data.data;
    } catch (err) {
      // Fallback for offline mock demo
      return mockTasks;
    }
  }
);

// Fetch full task details
export const fetchTaskDetails = createAsyncThunk(
  'task/fetchTaskDetails',
  async ({ workspaceId, taskId }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/tasks/${taskId}`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch task details');
    }
  }
);

// Create task
export const createTask = createAsyncThunk(
  'task/createTask',
  async ({ workspaceId, projectId, data }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/workspaces/${workspaceId}/tasks`, {
        ...data,
        projectId,
      });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create task');
    }
  }
);

// Update task
export const updateTask = createAsyncThunk(
  'task/updateTask',
  async ({ workspaceId, taskId, data }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/workspaces/${workspaceId}/tasks/${taskId}`, data);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update task');
    }
  }
);

// Delete task
export const deleteTask = createAsyncThunk(
  'task/deleteTask',
  async ({ workspaceId, taskId }, { rejectWithValue }) => {
    try {
      await api.delete(`/workspaces/${workspaceId}/tasks/${taskId}`);
      return taskId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete task');
    }
  }
);

// Add subtask
export const createSubtask = createAsyncThunk(
  'task/createSubtask',
  async ({ workspaceId, taskId, data }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/workspaces/${workspaceId}/tasks/${taskId}/subtasks`, data);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add subtask');
    }
  }
);

// Toggle/update subtask
export const updateSubtask = createAsyncThunk(
  'task/updateSubtask',
  async ({ workspaceId, taskId, subtaskId, data }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/workspaces/${workspaceId}/tasks/${taskId}/subtasks/${subtaskId}`,
        data
      );
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update subtask');
    }
  }
);

// Delete subtask
export const deleteSubtask = createAsyncThunk(
  'task/deleteSubtask',
  async ({ workspaceId, taskId, subtaskId }, { rejectWithValue }) => {
    try {
      await api.delete(`/workspaces/${workspaceId}/tasks/${taskId}/subtasks/${subtaskId}`);
      return subtaskId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete subtask');
    }
  }
);

// Add comment
export const createComment = createAsyncThunk(
  'task/createComment',
  async ({ workspaceId, taskId, data }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/workspaces/${workspaceId}/tasks/${taskId}/comments`, data);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to post comment');
    }
  }
);

// Move task across or within columns
export const moveTask = createAsyncThunk(
  'task/moveTask',
  async ({ workspaceId, taskId, status, position, previousTaskId, nextTaskId }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/workspaces/${workspaceId}/tasks/${taskId}/move`, {
        status,
        position,
        previousTaskId,
        nextTaskId,
      });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to move task');
    }
  }
);

const taskSlice = createSlice({
  name: 'task',
  initialState: {
    tasks: mockTasks,
    currentTaskDetails: null, // { task, subtasks, comments, history }
    isLoading: false,
    error: null,
  },
  reducers: {
    setCurrentTaskDetails: (state, action) => {
      state.currentTaskDetails = action.payload;
    },
    clearCurrentTask: (state) => {
      state.currentTaskDetails = null;
    },
    clearTaskError: (state) => {
      state.error = null;
    },
    moveTaskOptimistic: (state, action) => {
      const { taskId, status, position } = action.payload;
      const task = state.tasks.find((t) => (t._id || t.id) === taskId);
      if (task) {
        if (status) task.status = status;
        if (position !== undefined) task.position = position;
      }
    },
    applyRealtimeTaskCreated: (state, action) => {
      const task = action.payload?.task || action.payload;
      const taskId = task?._id || task?.id;
      if (taskId && !state.tasks.some((t) => (t._id || t.id) === taskId)) {
        state.tasks.unshift(task);
      }
    },
    applyRealtimeTaskUpdated: (state, action) => {
      const task = action.payload?.task || action.payload;
      const taskId = task?._id || task?.id;
      if (taskId) {
        const index = state.tasks.findIndex((t) => (t._id || t.id) === taskId);
        if (index !== -1) {
          state.tasks[index] = { ...state.tasks[index], ...task };
        }
        if (state.currentTaskDetails?.task && ((state.currentTaskDetails.task._id || state.currentTaskDetails.task.id) === taskId)) {
          state.currentTaskDetails.task = { ...state.currentTaskDetails.task, ...task };
        }
      }
    },
    applyRealtimeTaskMoved: (state, action) => {
      const { taskId, status, position, task } = action.payload || {};
      const targetId = taskId || (task && (task._id || task.id));
      const foundTask = state.tasks.find((t) => (t._id || t.id) === targetId);
      if (foundTask) {
        if (status) foundTask.status = status;
        if (position !== undefined) foundTask.position = position;
        if (task) {
          Object.assign(foundTask, task);
        }
      } else if (task) {
        state.tasks.push(task);
      }
    },
    applyRealtimeTaskDeleted: (state, action) => {
      const taskId = action.payload?.taskId || action.payload;
      state.tasks = state.tasks.filter((t) => (t._id || t.id) !== taskId);
      if (state.currentTaskDetails?.task && ((state.currentTaskDetails.task._id || state.currentTaskDetails.task.id) === taskId)) {
        state.currentTaskDetails = null;
      }
    },
    applyRealtimeCommentCreated: (state, action) => {
      const { taskId, comment } = action.payload || {};
      const targetId = taskId || comment?.task;
      const task = state.tasks.find((t) => (t._id || t.id) === targetId);
      if (task) {
        task.commentCount = (task.commentCount || 0) + 1;
      }
      if (state.currentTaskDetails?.task && ((state.currentTaskDetails.task._id || state.currentTaskDetails.task.id) === targetId)) {
        if (!state.currentTaskDetails.comments) {
          state.currentTaskDetails.comments = [];
        }
        if (comment && !state.currentTaskDetails.comments.some((c) => (c._id || c.id) === (comment._id || comment.id))) {
          state.currentTaskDetails.comments.push(comment);
        }
      }
    },
  },
  extraReducers: (builder) => {
    // moveTask
    builder.addCase(moveTask.fulfilled, (state, action) => {
      const index = state.tasks.findIndex((t) => t._id === action.payload._id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    });
    // fetchTasks
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload || [];
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // fetchTaskDetails
    builder
      .addCase(fetchTaskDetails.fulfilled, (state, action) => {
        state.currentTaskDetails = action.payload;
      });

    // createTask
    builder
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload);
      });

    // updateTask
    builder
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        if (state.currentTaskDetails?.task?._id === action.payload._id) {
          state.currentTaskDetails.task = action.payload;
        }
      });

    // deleteTask
    builder
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t._id !== action.payload);
        if (state.currentTaskDetails?.task?._id === action.payload) {
          state.currentTaskDetails = null;
        }
      });

    // createSubtask
    builder
      .addCase(createSubtask.fulfilled, (state, action) => {
        if (state.currentTaskDetails?.subtasks) {
          state.currentTaskDetails.subtasks.push(action.payload);
        }
      });

    // updateSubtask
    builder
      .addCase(updateSubtask.fulfilled, (state, action) => {
        if (state.currentTaskDetails?.subtasks) {
          const idx = state.currentTaskDetails.subtasks.findIndex(s => s._id === action.payload._id);
          if (idx !== -1) {
            state.currentTaskDetails.subtasks[idx] = action.payload;
          }
        }
      });

    // deleteSubtask
    builder
      .addCase(deleteSubtask.fulfilled, (state, action) => {
        if (state.currentTaskDetails?.subtasks) {
          state.currentTaskDetails.subtasks = state.currentTaskDetails.subtasks.filter(
            (s) => s._id !== action.payload
          );
        }
      });

    // createComment
    builder
      .addCase(createComment.fulfilled, (state, action) => {
        if (state.currentTaskDetails?.comments) {
          state.currentTaskDetails.comments.push(action.payload);
        }
      });
  },
});

export const { 
  setCurrentTaskDetails, 
  clearCurrentTask, 
  clearTaskError,
  moveTaskOptimistic,
  applyRealtimeTaskCreated,
  applyRealtimeTaskUpdated,
  applyRealtimeTaskMoved,
  applyRealtimeTaskDeleted,
  applyRealtimeCommentCreated,
} = taskSlice.actions;
export default taskSlice.reducer;
