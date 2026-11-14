import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import { mockProjects } from '../services/mockData';

// Fetch projects for a workspace
export const fetchProjects = createAsyncThunk(
  'project/fetchProjects',
  async ({ workspaceId, status, priority, search }, { rejectWithValue }) => {
    try {
      const params = {};
      if (status && status !== 'all') params.status = status;
      if (priority && priority !== 'all') params.priority = priority;
      if (search) params.search = search;

      const response = await api.get(`/workspaces/${workspaceId}/projects`, { params });
      return response.data.data;
    } catch (err) {
      // Fallback for offline mock demo
      return mockProjects;
    }
  }
);

// Fetch single project details with metrics
export const fetchProjectDetails = createAsyncThunk(
  'project/fetchProjectDetails',
  async ({ workspaceId, projectId }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/projects/${projectId}`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch project details');
    }
  }
);

// Create a new project
export const createProject = createAsyncThunk(
  'project/createProject',
  async ({ workspaceId, data }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/workspaces/${workspaceId}/projects`, data);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create project');
    }
  }
);

// Update an existing project
export const updateProject = createAsyncThunk(
  'project/updateProject',
  async ({ workspaceId, projectId, data }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/workspaces/${workspaceId}/projects/${projectId}`, data);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update project');
    }
  }
);

// Archive a project
export const archiveProject = createAsyncThunk(
  'project/archiveProject',
  async ({ workspaceId, projectId }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/workspaces/${workspaceId}/projects/${projectId}/archive`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to archive project');
    }
  }
);

// Delete a project
export const deleteProject = createAsyncThunk(
  'project/deleteProject',
  async ({ workspaceId, projectId }, { rejectWithValue }) => {
    try {
      await api.delete(`/workspaces/${workspaceId}/projects/${projectId}`);
      return projectId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete project');
    }
  }
);

const projectSlice = createSlice({
  name: 'project',
  initialState: {
    projects: mockProjects,
    currentProject: null,
    metrics: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    clearProjectError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchProjects
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload || [];
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // fetchProjectDetails
    builder
      .addCase(fetchProjectDetails.fulfilled, (state, action) => {
        state.currentProject = action.payload.project;
        state.metrics = action.payload.metrics;
      });

    // createProject
    builder
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.unshift(action.payload);
      });

    // updateProject
    builder
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.currentProject?._id === action.payload._id) {
          state.currentProject = action.payload;
        }
      });

    // deleteProject
    builder
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter((p) => p._id !== action.payload);
        if (state.currentProject?._id === action.payload) {
          state.currentProject = null;
        }
      });
  },
});

export const { setCurrentProject, clearProjectError } = projectSlice.actions;
export default projectSlice.reducer;
