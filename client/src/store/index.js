import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import workspaceReducer from './workspaceSlice';
import projectReducer from './projectSlice';
import taskReducer from './taskSlice';
import notificationReducer from './notificationSlice';
import analyticsReducer from './analyticsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspace: workspaceReducer,
    project: projectReducer,
    task: taskReducer,
    notification: notificationReducer,
    analytics: analyticsReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
