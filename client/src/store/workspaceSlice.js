import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import { mockWorkspaces, mockMembers } from '../services/mockData';

// Fetch all workspaces for the authenticated user
export const fetchWorkspaces = createAsyncThunk(
  'workspace/fetchWorkspaces',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/workspaces');
      return response.data.data;
    } catch (err) {
      // Fallback for offline demo mode
      return mockWorkspaces.map((w) => ({
        workspace: w,
        role: 'ADMIN',
        memberCount: 5,
      }));
    }
  }
);

// Create a new workspace
export const createWorkspace = createAsyncThunk(
  'workspace/createWorkspace',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/workspaces', formData);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create workspace');
    }
  }
);

// Update workspace details
export const updateWorkspace = createAsyncThunk(
  'workspace/updateWorkspace',
  async ({ workspaceId, data }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/workspaces/${workspaceId}`, data);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update workspace');
    }
  }
);

// Fetch members of a workspace
export const fetchMembers = createAsyncThunk(
  'workspace/fetchMembers',
  async (workspaceId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/members`);
      return response.data.data;
    } catch (err) {
      // Fallback for offline mock demo
      return mockMembers;
    }
  }
);

// Invite a new member by email
export const inviteMember = createAsyncThunk(
  'workspace/inviteMember',
  async ({ workspaceId, email, role }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/workspaces/${workspaceId}/invitations`, { email, role });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to send invitation');
    }
  }
);

// Update member role
export const updateMemberRole = createAsyncThunk(
  'workspace/updateMemberRole',
  async ({ workspaceId, memberId, role }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/workspaces/${workspaceId}/members/${memberId}/role`,
        { role }
      );
      return { memberId, role, data: response.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update member role');
    }
  }
);

// Remove member
export const removeMember = createAsyncThunk(
  'workspace/removeMember',
  async ({ workspaceId, memberId }, { rejectWithValue }) => {
    try {
      await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
      return memberId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove member');
    }
  }
);

// Fetch pending invitations
export const fetchInvitations = createAsyncThunk(
  'workspace/fetchInvitations',
  async (workspaceId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/workspaces/${workspaceId}/invitations`);
      return response.data.data;
    } catch (err) {
      return [];
    }
  }
);

// Accept invitation
export const acceptInvitation = createAsyncThunk(
  'workspace/acceptInvitation',
  async (token, { rejectWithValue }) => {
    try {
      const response = await api.post(`/workspaces/invitations/${token}/accept`);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to accept invitation');
    }
  }
);

// Upload workspace logo
export const uploadWorkspaceLogo = createAsyncThunk(
  'workspace/uploadWorkspaceLogo',
  async ({ workspaceId, formData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/upload/workspace/${workspaceId}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to upload workspace logo');
    }
  }
);

const savedWorkspaceId = typeof window !== 'undefined'
  ? localStorage.getItem('teamflow_active_workspace_id')
  : null;

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState: {
    workspaces: mockWorkspaces.map((w) => ({
      workspace: w,
      role: 'ADMIN',
      memberCount: 5,
    })),
    currentWorkspace: mockWorkspaces[0],
    members: mockMembers,
    invitations: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    setCurrentWorkspace: (state, action) => {
      state.currentWorkspace = action.payload;
      if (typeof window !== 'undefined' && action.payload?._id) {
        localStorage.setItem('teamflow_active_workspace_id', action.payload._id);
      }
    },
    clearWorkspaceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchWorkspaces
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload && action.payload.length > 0) {
          state.workspaces = action.payload;
          // Set current workspace if not already set or not in list
          if (!state.currentWorkspace || !action.payload.some(w => w.workspace._id === state.currentWorkspace._id)) {
            state.currentWorkspace = action.payload[0].workspace;
          }
        }
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // createWorkspace
    builder
      .addCase(createWorkspace.fulfilled, (state, action) => {
        const newEntry = {
          workspace: action.payload,
          role: 'ADMIN',
          memberCount: 1,
        };
        state.workspaces.unshift(newEntry);
        state.currentWorkspace = action.payload;
      });

    // updateWorkspace
    builder
      .addCase(updateWorkspace.fulfilled, (state, action) => {
        state.currentWorkspace = action.payload;
        const index = state.workspaces.findIndex((w) => w.workspace._id === action.payload._id);
        if (index !== -1) {
          state.workspaces[index].workspace = action.payload;
        }
      });

    // fetchMembers
    builder
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.members = action.payload;
      });

    // updateMemberRole
    builder
      .addCase(updateMemberRole.fulfilled, (state, action) => {
        const member = state.members.find((m) => m._id === action.payload.memberId);
        if (member) {
          member.role = action.payload.role;
        }
      });

    // removeMember
    builder
      .addCase(removeMember.fulfilled, (state, action) => {
        state.members = state.members.filter((m) => m._id !== action.payload);
      });

    // fetchInvitations
    builder
      .addCase(fetchInvitations.fulfilled, (state, action) => {
        state.invitations = action.payload;
      });

    // uploadWorkspaceLogo
    builder
      .addCase(uploadWorkspaceLogo.fulfilled, (state, action) => {
        const logoUrl = action.payload.logoUrl || action.payload.workspace?.logo;
        if (state.currentWorkspace) {
          state.currentWorkspace.logo = logoUrl;
        }
        const wsEntry = state.workspaces.find(
          (w) => (w.workspace?._id || w.workspace?.id) === (state.currentWorkspace?._id || state.currentWorkspace?.id)
        );
        if (wsEntry && wsEntry.workspace) {
          wsEntry.workspace.logo = logoUrl;
        }
      });
  },
});

export const { setCurrentWorkspace, clearWorkspaceError } = workspaceSlice.actions;
export default workspaceSlice.reducer;
