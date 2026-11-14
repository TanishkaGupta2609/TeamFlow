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
  },
  extraReducers: (builder) => {
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

export const { setCurrentTaskDetails, clearCurrentTask, clearTaskError } = taskSlice.actions;
export default taskSlice.reducer;
