import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  Button,
  IconButton,
  Input,
  PasswordInput,
  FormField,
  StatusBadge,
  PriorityBadge,
  Avatar,
  AvatarGroup,
  ProgressBar,
  Tabs,
  Modal,
  DataTable,
  EmptyState,
} from './index';

describe('UI Design System Components', () => {
  describe('Button Component', () => {
    it('renders with default primary variant', () => {
      render(<Button>Click Me</Button>);
      const btn = screen.getByRole('button', { name: /click me/i });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveClass('bg-forest');
    });

    it('renders destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      const btn = screen.getByRole('button', { name: /delete/i });
      expect(btn).toHaveClass('bg-status-danger');
    });

    it('handles disabled state', () => {
      render(<Button disabled>Disabled Button</Button>);
      const btn = screen.getByRole('button', { name: /disabled button/i });
      expect(btn).toBeDisabled();
    });

    it('shows loading indicator when isLoading is true', () => {
      render(<Button isLoading>Loading State</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
    });

    it('triggers onClick handler', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Submit</Button>);
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form Components', () => {
    it('renders Input with label and helperText', () => {
      render(
        <Input
          id="test-input"
          label="Email Address"
          helperText="We will never share your email"
          defaultValue="user@"
        />
      );
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByText(/we will never share your email/i)).toBeInTheDocument();
    });

    it('renders Input with validation error message', () => {
      render(
        <Input
          id="test-input-err"
          label="Workspace Slug"
          error="Invalid slug format"
          defaultValue="invalid slug"
        />
      );
      expect(screen.getByText(/invalid slug format/i)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('toggles password visibility in PasswordInput', () => {
      render(<PasswordInput id="pwd" label="Account Password" defaultValue="secret123" />);
      const input = screen.getByLabelText(/^account password$/i);
      expect(input).toHaveAttribute('type', 'password');

      const toggleBtn = screen.getByRole('button', { name: /show password/i });
      fireEvent.click(toggleBtn);
      expect(input).toHaveAttribute('type', 'text');
    });
  });

  describe('Badge Components', () => {
    it('renders StatusBadge with formatted text', () => {
      render(<StatusBadge status="in_progress" />);
      expect(screen.getByText(/in progress/i)).toBeInTheDocument();
    });

    it('renders PriorityBadge with urgent state', () => {
      render(<PriorityBadge priority="urgent" />);
      expect(screen.getByText(/urgent/i)).toBeInTheDocument();
    });
  });

  describe('Avatar & AvatarGroup', () => {
    it('generates correct initials from name', () => {
      render(<Avatar name="Tanishka Gupta" />);
      expect(screen.getByText('TG')).toBeInTheDocument();
    });

    it('renders AvatarGroup with overflow indicator', () => {
      const users = [
        { id: 1, name: 'Alice Adams' },
        { id: 2, name: 'Bob Brown' },
        { id: 3, name: 'Charlie Clark' },
        { id: 4, name: 'Diana Prince' },
      ];
      render(<AvatarGroup users={users} max={2} />);
      expect(screen.getByText('AA')).toBeInTheDocument();
      expect(screen.getByText('BB')).toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument();
    });
  });

  describe('ProgressBar Component', () => {
    it('renders progress bar with correct aria attributes', () => {
      render(<ProgressBar value={75} max={100} label="Completion" />);
      expect(screen.getByText('Completion')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuenow', '75');
    });
  });

  describe('Tabs Component', () => {
    it('renders tabs and handles tab selection', () => {
      const handleTabChange = vi.fn();
      render(
        <Tabs
          tabs={[
            { id: 'tab1', label: 'Tab One' },
            { id: 'tab2', label: 'Tab Two' },
          ]}
          activeTab="tab1"
          onChange={handleTabChange}
        />
      );
      expect(screen.getByText('Tab One')).toBeInTheDocument();
      const tab2 = screen.getByText('Tab Two');
      fireEvent.click(tab2);
      expect(handleTabChange).toHaveBeenCalledWith('tab2');
    });
  });

  describe('Modal Component', () => {
    it('renders modal dialog when isOpen is true', () => {
      render(
        <Modal isOpen={true} title="Test Modal" onClose={() => {}}>
          <p>Modal body content</p>
        </Modal>
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal body content')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(
        <Modal isOpen={false} title="Test Modal" onClose={() => {}}>
          <p>Hidden content</p>
        </Modal>
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('DataTable & EmptyState', () => {
    it('renders empty state when data is empty', () => {
      render(<DataTable columns={[{ key: 'name', header: 'Name' }]} data={[]} emptyTitle="No Projects" />);
      expect(screen.getByText('No Projects')).toBeInTheDocument();
    });

    it('renders rows and columns with data', () => {
      const data = [{ id: 1, name: 'Project Alpha' }];
      const columns = [{ key: 'name', header: 'Project Name' }];
      render(<DataTable columns={columns} data={data} />);
      expect(screen.getByText('Project Name')).toBeInTheDocument();
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });
  });
});
