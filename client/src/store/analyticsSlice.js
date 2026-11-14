import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import { mockAnalytics, mockTasks } from '../services/mockData';

// Fetch workspace analytics
export const fetchAnalytics = createAsyncThunk(
  'analytics/fetchAnalytics',
  async (workspaceId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/analytics`);
      return response.data.data;
    } catch (err) {
      // Fallback demo data if offline
      return {
        overview: {
          totalProjects: 4,
          activeProjects: 3,
          completedProjects: 1,
          overallProgress: 68,
          totalTasks: 62,
          completedTasks: 46,
          pendingTasks: 16,
          overdueTasks: 3,
          completionRate: 74,
        },
        statusDistribution: [
          { status: 'BACKLOG', label: 'Backlog', count: 6, color: '#94A3B8' },
          { status: 'TODO', label: 'To Do', count: 10, color: '#A9B8A5' },
          { status: 'IN_PROGRESS', label: 'In Progress', count: 18, color: '#173F35' },
          { status: 'IN_REVIEW', label: 'In Review', count: 8, color: '#D49A52' },
          { status: 'DONE', label: 'Done', count: 20, color: '#477A5B' },
        ],
        priorityDistribution: [
          { priority: 'LOW', label: 'Low', count: 12, color: '#477A5B' },
          { priority: 'MEDIUM', label: 'Medium', count: 24, color: '#285747' },
          { priority: 'HIGH', label: 'High', count: 18, color: '#D49A52' },
          { priority: 'CRITICAL', label: 'Critical', count: 8, color: '#C66A5A' },
        ],
        weeklyVelocity: [
          { week: 'Week 1', completed: 8 },
          { week: 'Week 2', completed: 14 },
          { week: 'Week 3', completed: 11 },
          { week: 'Week 4', completed: 19 },
        ],
        teamWorkload: [
          {
            memberId: 'm1',
            name: 'Liam Vance',
            role: 'Product Lead',
            assignedTasks: 12,
            completedTasks: 10,
            pendingTasks: 2,
            productivityRate: 83,
          },
          {
            memberId: 'm2',
            name: 'Sarah Chen',
            role: 'Lead Architect',
            assignedTasks: 15,
            completedTasks: 13,
            pendingTasks: 2,
            productivityRate: 87,
          },
          {
            memberId: 'm3',
            name: 'Marcus Brody',
            role: 'Senior Backend Engineer',
            assignedTasks: 10,
            completedTasks: 7,
            pendingTasks: 3,
            productivityRate: 70,
          },
        ],
        projectProgressChart: [
          { name: 'Core SaaS Engine', progress: 85, status: 'ACTIVE', priority: 'HIGH' },
          { name: 'Design System & UI', progress: 100, status: 'COMPLETED', priority: 'HIGH' },
          { name: 'Billing & Subscriptions', progress: 40, status: 'ACTIVE', priority: 'MEDIUM' },
        ],
      };
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    data: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearAnalyticsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAnalyticsError } = analyticsSlice.actions;
export default analyticsSlice.reducer;
