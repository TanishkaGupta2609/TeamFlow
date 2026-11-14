import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import ToastProvider from '../components/ui/Toast';

// Pages
import DashboardPage from '../pages/DashboardPage';
import ProjectsPage from '../pages/ProjectsPage';
import TasksPage from '../pages/TasksPage';
import KanbanPage from '../pages/KanbanPage';
import TeamPage from '../pages/TeamPage';
import CalendarPage from '../pages/CalendarPage';
import ReportsPage from '../pages/ReportsPage';
import SettingsPage from '../pages/SettingsPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        {component}
      </ToastProvider>
    </BrowserRouter>
  );
};

describe('Stage 02 Frontend Screens', () => {
  it('renders DashboardPage with metrics and task list', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/Total Projects/i)).toBeInTheDocument();
    expect(screen.getByText(/Completed Tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending Tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/Weekly Task Velocity/i)).toBeInTheDocument();
  });

  it('renders ProjectsPage with project cards and filter controls', () => {
    renderWithProviders(<ProjectsPage />);
    expect(screen.getByRole('heading', { level: 1, name: /projects/i })).toBeInTheDocument();
    expect(screen.getByText(/SaaS Workspace Redesign/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument();
  });

  it('renders TasksPage with tabs and search filter', () => {
    renderWithProviders(<TasksPage />);
    expect(screen.getByRole('heading', { level: 1, name: /my tasks/i })).toBeInTheDocument();
    expect(screen.getByText(/All Tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/Assigned to Me/i)).toBeInTheDocument();
  });

  it('renders KanbanPage with 5 status columns', () => {
    renderWithProviders(<KanbanPage />);
    expect(screen.getByRole('heading', { level: 1, name: /kanban board/i })).toBeInTheDocument();
    expect(screen.getByText(/Backlog/i)).toBeInTheDocument();
    expect(screen.getByText(/To Do/i)).toBeInTheDocument();
    expect(screen.getByText(/In Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/In Review/i)).toBeInTheDocument();
    expect(screen.getByText(/Done/i)).toBeInTheDocument();
  });

  it('renders TeamPage with member roster table', () => {
    renderWithProviders(<TeamPage />);
    expect(screen.getByRole('heading', { level: 1, name: /team & members/i })).toBeInTheDocument();
    expect(screen.getByText(/Liam Vance/i)).toBeInTheDocument();
    expect(screen.getByText(/Sarah Chen/i)).toBeInTheDocument();
  });

  it('renders CalendarPage with monthly view grid', () => {
    renderWithProviders(<CalendarPage />);
    expect(screen.getByRole('heading', { level: 1, name: /delivery calendar/i })).toBeInTheDocument();
    expect(screen.getByText(/November 2026/i)).toBeInTheDocument();
  });

  it('renders ReportsPage with completion metrics and chart sections', () => {
    renderWithProviders(<ReportsPage />);
    expect(screen.getByRole('heading', { level: 1, name: /analytics & reports/i })).toBeInTheDocument();
    expect(screen.getByText(/Completion Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Task Status Distribution/i)).toBeInTheDocument();
  });

  it('renders SettingsPage with profile tabs', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getAllByText(/Workspace Settings/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Profile Settings/i)).toBeInTheDocument();
  });

  it('renders LoginPage with credentials inputs', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('heading', { level: 2, name: /sign in to teamflow/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your account password/i)).toBeInTheDocument();
  });

  it('renders RegisterPage with organization input', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByRole('heading', { level: 2, name: /create teamflow account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/organization \/ workspace name/i)).toBeInTheDocument();
  });
});
