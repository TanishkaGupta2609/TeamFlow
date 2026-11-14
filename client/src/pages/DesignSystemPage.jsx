import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  Settings, 
  Bell, 
  Mail, 
  Edit3, 
  Share2, 
  ExternalLink,
  Search,
  Sparkles,
  Info
} from 'lucide-react';
import {
  Button,
  IconButton,
  Input,
  PasswordInput,
  Textarea,
  Select,
  DatePicker,
  Checkbox,
  RadioGroup,
  SearchInput,
  useToast,
  Modal,
  ConfirmationDialog,
  Tooltip,
  DropdownMenu,
  LoadingSpinner,
  SkeletonLoader,
  EmptyState,
  ErrorState,
  StatusBadge,
  PriorityBadge,
  Avatar,
  AvatarGroup,
  ProgressBar,
  Pagination,
  DataTable,
  Tabs,
} from '../components/ui';

export const DesignSystemPage = () => {
  const toast = useToast();

  // Interactive component states
  const [btnLoading, setBtnLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [checkboxVal, setCheckboxVal] = useState(true);
  const [radioVal, setRadioVal] = useState('active');
  const [progressVal, setProgressVal] = useState(65);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTableRows, setSelectedTableRows] = useState([1]);
  const [tableSort, setTableSort] = useState({ column: 'name', direction: 'asc' });

  // Sample data for Avatar Group
  const sampleUsers = [
    { id: 1, name: 'Tanishka Gupta', status: 'online' },
    { id: 2, name: 'Liam Vance', status: 'away' },
    { id: 3, name: 'Sarah Chen', status: 'busy' },
    { id: 4, name: 'Marcus Brody', status: 'offline' },
    { id: 5, name: 'Elena Rostova' },
    { id: 6, name: 'David Kim' },
  ];

  // Sample data for Data Table
  const tableColumns = [
    { key: 'name', header: 'Project / Task', sortable: true },
    { 
      key: 'lead', 
      header: 'Assignee',
      render: (lead) => (
        <div className="flex items-center gap-2">
          <Avatar name={lead.name} size="xs" status={lead.status} />
          <span className="font-medium text-charcoal">{lead.name}</span>
        </div>
      )
    },
    { 
      key: 'priority', 
      header: 'Priority',
      render: (p) => <PriorityBadge priority={p} size="sm" />
    },
    { 
      key: 'status', 
      header: 'Status',
      render: (s) => <StatusBadge status={s} size="sm" />
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (v) => <ProgressBar value={v} size="sm" showPercentage={false} />
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (_, row) => (
        <DropdownMenu
          align="right"
          trigger={<IconButton icon={<Settings className="w-3.5 h-3.5" />} aria-label="Options" size="sm" />}
          items={[
            { label: 'Edit Item', icon: <Edit3 className="w-3.5 h-3.5" />, onClick: () => toast.info('Edit Clicked', `Editing ${row.name}`) },
            { label: 'Share Link', icon: <Share2 className="w-3.5 h-3.5" />, onClick: () => toast.success('Link Copied', 'Shared to clipboard') },
            { type: 'divider' },
            { label: 'Delete Item', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => setConfirmOpen(true) },
          ]}
        />
      )
    }
  ];

  const tableData = [
    { id: 1, name: 'SaaS Workspace Redesign', lead: { name: 'Tanishka Gupta', status: 'online' }, priority: 'urgent', status: 'in_progress', progress: 75 },
    { id: 2, name: 'Kanban Drag-and-Drop Engine', lead: { name: 'Liam Vance', status: 'away' }, priority: 'high', status: 'active', progress: 50 },
    { id: 3, name: 'Real-time WebSocket Gateway', lead: { name: 'Sarah Chen', status: 'busy' }, priority: 'medium', status: 'review', progress: 90 },
    { id: 4, name: 'MongoDB Migration & Seed Data', lead: { name: 'Marcus Brody', status: 'offline' }, priority: 'low', status: 'completed', progress: 100 },
  ];

  const sortedTableData = [...tableData].sort((a, b) => {
    const { column, direction } = tableSort;
    const aVal = a[column];
    const bVal = b[column];
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-12 pb-16">
      {/* Header */}
      <section className="bg-white rounded-xl border border-border p-6 sm:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-forest/10 text-forest text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-accent" />
              Stage 01 UI Foundation
            </div>
            <h1 className="text-3xl font-heading font-extrabold text-charcoal tracking-tight">
              Design System Showcase
            </h1>
            <p className="text-sm text-charcoal-secondary mt-1 max-w-2xl">
              Strictly implemented design system adhering to TeamFlow's visual identity: Forest Green, Warm Ivory, Muted Sage, and Amber accents.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBtnLoading(!btnLoading)}
            >
              Toggle Loading States
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => toast.success('Design System Ready', 'All tokens and components verified.')}
            >
              Test Notification
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION 1: Color Palette & Typography Tokens */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-bold text-charcoal flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-forest"></span>
          1. Design Tokens &amp; Color Palette
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="p-3 bg-white rounded-lg border border-border shadow-subtle">
            <div className="h-12 rounded bg-forest border border-black/10 mb-2"></div>
            <p className="text-xs font-bold text-charcoal">Forest Primary</p>
            <p className="text-[11px] text-charcoal-secondary font-mono">#173F35</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-border shadow-subtle">
            <div className="h-12 rounded bg-forest-secondary border border-black/10 mb-2"></div>
            <p className="text-xs font-bold text-charcoal">Forest Secondary</p>
            <p className="text-[11px] text-charcoal-secondary font-mono">#285747</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-border shadow-subtle">
            <div className="h-12 rounded bg-ivory border border-border mb-2"></div>
            <p className="text-xs font-bold text-charcoal">Warm Ivory</p>
            <p className="text-[11px] text-charcoal-secondary font-mono">#F7F6F2</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-border shadow-subtle">
            <div className="h-12 rounded bg-sage border border-black/10 mb-2"></div>
            <p className="text-xs font-bold text-charcoal">Muted Sage</p>
            <p className="text-[11px] text-charcoal-secondary font-mono">#A9B8A5</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-border shadow-subtle">
            <div className="h-12 rounded bg-amber-accent border border-black/10 mb-2"></div>
            <p className="text-xs font-bold text-charcoal">Amber Accent</p>
            <p className="text-[11px] text-charcoal-secondary font-mono">#D49A52</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-border shadow-subtle">
            <div className="h-12 rounded bg-charcoal border border-black/10 mb-2"></div>
            <p className="text-xs font-bold text-charcoal">Charcoal Text</p>
            <p className="text-[11px] text-charcoal-secondary font-mono">#242B27</p>
          </div>
        </div>
      </section>

      {/* SECTION 2: Buttons & IconButtons */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-bold text-charcoal flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-forest"></span>
          2. Buttons &amp; Interactive Triggers
        </h2>

        <div className="p-6 bg-white rounded-xl border border-border shadow-card space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-charcoal-secondary uppercase tracking-wider mb-3">
              Variants (Default, Left Icon, Right Icon)
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" isLoading={btnLoading} leftIcon={<Plus className="w-4 h-4" />}>
                Primary Button
              </Button>
              <Button variant="secondary" isLoading={btnLoading} leftIcon={<Share2 className="w-4 h-4" />}>
                Secondary Button
              </Button>
              <Button variant="outline" isLoading={btnLoading} leftIcon={<Download className="w-4 h-4" />}>
                Outline Button
              </Button>
              <Button variant="ghost" isLoading={btnLoading}>
                Ghost Button
              </Button>
              <Button variant="destructive" isLoading={btnLoading} leftIcon={<Trash2 className="w-4 h-4" />}>
                Destructive Button
              </Button>
              <Button variant="primary" disabled>
                Disabled State
              </Button>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="text-xs font-semibold text-charcoal-secondary uppercase tracking-wider mb-3">
              Button Sizes &amp; Icon Buttons
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="sm" variant="primary">Small (h-8)</Button>
              <Button size="md" variant="primary">Medium (h-10)</Button>
              <Button size="lg" variant="primary">Large (h-12)</Button>

              <div className="h-6 w-px bg-border mx-2"></div>

              <IconButton icon={<Plus className="w-4 h-4" />} aria-label="Add project" variant="primary" size="md" />
              <IconButton icon={<Mail className="w-4 h-4" />} aria-label="Inbox" variant="outline" size="md" />
              <IconButton icon={<Settings className="w-4 h-4" />} aria-label="Settings" variant="ghost" size="md" />
              <IconButton icon={<Trash2 className="w-4 h-4" />} aria-label="Delete" variant="destructive" size="md" />
              <IconButton icon={<Bell className="w-4 h-4" />} aria-label="Notifications" variant="outline" size="sm" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Form Controls */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-bold text-charcoal flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-forest"></span>
          3. Form Components &amp; Validation
        </h2>

        <div className="p-6 bg-white rounded-xl border border-border shadow-card">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Input
              id="f-name"
              label="Project Title"
              placeholder="e.g. Mobile Application v2"
              required
              helperText="Give your project a memorable, descriptive name."
            />

            <PasswordInput
              id="f-pass"
              label="Account Password"
              placeholder="Enter secure password"
              required
              helperText="Minimum 8 characters with letters & numbers."
            />

            <Input
              id="f-err"
              label="Workspace Slug (Validation Error)"
              defaultValue="teamflow invalid slug @"
              error="Workspace slug can only contain lowercase letters, numbers, and dashes."
              required
            />

            <Select
              id="f-role"
              label="Member Role"
              required
              options={[
                { label: 'Workspace Owner', value: 'owner' },
                { label: 'Project Manager', value: 'pm' },
                { label: 'Contributor', value: 'member' },
                { label: 'Guest / Viewer', value: 'viewer' },
              ]}
              defaultValue="pm"
            />

            <DatePicker
              id="f-date"
              label="Target Delivery Date"
              required
              defaultValue="2026-12-31"
            />

            <SearchInput
              id="f-search"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Filter components..."
            />

            <div className="lg:col-span-3">
              <Textarea
                id="f-desc"
                label="Project Description"
                placeholder="Outline objectives, key deliverables, and team responsibilities..."
                rows={3}
                maxLength={300}
                showCount
                defaultValue="TeamFlow helps distributed organizations organize projects, track deadlines, and maintain focus with high-performance Kanban boards."
              />
            </div>

            <div className="p-4 rounded-lg bg-ivory border border-border flex flex-col gap-3">
              <span className="text-xs font-semibold text-charcoal">Checkboxes</span>
              <Checkbox
                id="c-1"
                label="Send email notification"
                description="Receive daily summaries at 9:00 AM."
                checked={checkboxVal}
                onChange={(e) => setCheckboxVal(e.target.checked)}
              />
              <Checkbox
                id="c-2"
                label="Indeterminate Task"
                description="Partial checklist completed."
                indeterminate={true}
              />
              <Checkbox
                id="c-3"
                label="Disabled option"
                disabled={true}
              />
            </div>

            <div className="p-4 rounded-lg bg-ivory border border-border md:col-span-2 flex flex-col gap-3">
              <RadioGroup
                name="proj-status"
                label="Project Visibility"
                value={radioVal}
                onChange={setRadioVal}
                orientation="horizontal"
                options={[
                  { label: 'Active', value: 'active', description: 'Visible to all workspace members' },
                  { label: 'Private', value: 'private', description: 'Restricted to invited assignees only' },
                  { label: 'Archived', value: 'archived', description: 'Read-only historical project' },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Feedback Components */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-bold text-charcoal flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-forest"></span>
          4. Feedback &amp; Overlay Components
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Toasts & Dialogs */}
          <div className="p-6 bg-white rounded-xl border border-border shadow-card space-y-4">
            <h3 className="text-sm font-heading font-bold text-charcoal">
              Toast Notifications &amp; Dialogs
            </h3>
            <p className="text-xs text-charcoal-secondary">
              Accessible alert toasts and modal overlays with keyboard trap and escape handlers.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="text-status-success border-status-success/30 hover:bg-emerald-50"
                onClick={() => toast.success('Project Created', 'Project was successfully initialized in MongoDB.')}
              >
                Success Toast
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-status-warning border-status-warning/30 hover:bg-amber-50"
                onClick={() => toast.warning('Deadline Approaching', '2 tasks are due within 24 hours.')}
              >
                Warning Toast
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-status-danger border-status-danger/30 hover:bg-rose-50"
                onClick={() => toast.error('Connection Lost', 'Unable to reach backend Socket.IO gateway.')}
              >
                Error Toast
              </Button>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-border">
              <Button
                size="sm"
                variant="primary"
                onClick={() => setModalOpen(true)}
              >
                Open Demo Modal
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
              >
                Open Confirm Dialog
              </Button>

              <Tooltip content="Tooltip helper on right position" position="right">
                <Button size="sm" variant="ghost" leftIcon={<Info className="w-4 h-4 text-forest" />}>
                  Hover for Tooltip
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* Spinners & Skeleton Loaders */}
          <div className="p-6 bg-white rounded-xl border border-border shadow-card space-y-4">
            <h3 className="text-sm font-heading font-bold text-charcoal">
              Spinners &amp; Skeleton Placeholders
            </h3>
            <div className="flex items-center gap-6">
              <LoadingSpinner size="sm" label="Small" />
              <LoadingSpinner size="md" color="forest" label="Medium" />
              <LoadingSpinner size="lg" color="amber" label="Large" />
            </div>

            <div className="pt-3 border-t border-border space-y-2">
              <span className="text-xs font-semibold text-charcoal-secondary uppercase tracking-wider">
                Skeleton Loading State
              </span>
              <div className="flex items-center gap-3">
                <SkeletonLoader variant="circular" width="36px" height="36px" />
                <div className="flex-1 space-y-1.5">
                  <SkeletonLoader variant="text" width="60%" height="12px" />
                  <SkeletonLoader variant="text" width="40%" height="10px" />
                </div>
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="p-6 bg-white rounded-xl border border-border shadow-card">
            <EmptyState
              title="No Tasks Assigned Yet"
              description="When you are assigned tasks by project leads, they will appear in this workspace board."
              action={
                <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Create Task
                </Button>
              }
            />
          </div>

          {/* Error State */}
          <div className="p-6 bg-white rounded-xl border border-border shadow-card">
            <ErrorState
              title="Failed to Load Workspace Analytics"
              message="The requested metrics could not be computed. Check your database connection."
              onRetry={() => toast.info('Retrying', 'Requesting data from /api/health')}
            />
          </div>
        </div>
      </section>

      {/* SECTION 5: Data Components */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-bold text-charcoal flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-forest"></span>
          5. Data Display, Badges &amp; Tables
        </h2>

        <div className="p-6 bg-white rounded-xl border border-border shadow-card space-y-6">
          {/* Status & Priority Badges */}
          <div>
            <h3 className="text-xs font-semibold text-charcoal-secondary uppercase tracking-wider mb-3">
              Status Badges &amp; Priority Badges
            </h3>
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <StatusBadge status="active" />
              <StatusBadge status="in_progress" />
              <StatusBadge status="completed" />
              <StatusBadge status="planning" />
              <StatusBadge status="todo" />
              <StatusBadge status="review" />
              <StatusBadge status="on_hold" />
              <StatusBadge status="blocked" />
              <StatusBadge status="cancelled" />
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <PriorityBadge priority="low" />
              <PriorityBadge priority="medium" />
              <PriorityBadge priority="high" />
              <PriorityBadge priority="urgent" />
            </div>
          </div>

          {/* Avatars & Progress Bar */}
          <div className="border-t border-border pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-semibold text-charcoal-secondary uppercase tracking-wider mb-3">
                Avatars &amp; Avatar Groups
              </h3>
              <div className="flex items-center gap-4">
                <Avatar name="Tanishka Gupta" size="lg" status="online" />
                <Avatar name="Sarah Chen" size="md" status="busy" />
                <Avatar name="Liam Vance" size="sm" status="away" />
                <Avatar name="David Kim" size="xs" status="offline" />

                <div className="h-8 w-px bg-border mx-2"></div>

                <AvatarGroup users={sampleUsers} max={3} size="md" />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-charcoal-secondary uppercase tracking-wider mb-3">
                Progress Bar
              </h3>
              <ProgressBar
                value={progressVal}
                label="Sprint Velocity"
                variant="forest"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => setProgressVal(Math.max(0, progressVal - 10))}
                  className="px-2 py-0.5 text-[11px] border border-border rounded bg-ivory hover:bg-ivory-muted"
                >
                  -10%
                </button>
                <button
                  onClick={() => setProgressVal(Math.min(100, progressVal + 10))}
                  className="px-2 py-0.5 text-[11px] border border-border rounded bg-ivory hover:bg-ivory-muted"
                >
                  +10%
                </button>
              </div>
            </div>
          </div>

          {/* Tabs Control */}
          <div className="border-t border-border pt-4">
            <h3 className="text-xs font-semibold text-charcoal-secondary uppercase tracking-wider mb-3">
              Tab Navigation (Pill &amp; Line Styles)
            </h3>
            <Tabs
              variant="pill"
              tabs={[
                { id: 'all', label: 'All Projects', badge: 12 },
                { id: 'active', label: 'Active', badge: 8 },
                { id: 'completed', label: 'Completed', badge: 4 },
              ]}
            />
          </div>

          {/* Data Table */}
          <div className="border-t border-border pt-4">
            <h3 className="text-xs font-semibold text-charcoal-secondary uppercase tracking-wider mb-3">
              Data Table with Sorting, Row Checkboxes &amp; Action Menus
            </h3>
            <DataTable
              columns={tableColumns}
              data={sortedTableData}
              sortColumn={tableSort.column}
              sortDirection={tableSort.direction}
              onSort={(col, dir) => setTableSort({ column: col, direction: dir })}
              selectedIds={selectedTableRows}
              onSelectRow={(id, checked) => {
                setSelectedTableRows((prev) =>
                  checked ? [...prev, id] : prev.filter((i) => i !== id)
                );
              }}
              onSelectAll={(checked) => {
                setSelectedTableRows(checked ? tableData.map((d) => d.id) : []);
              }}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={4}
              totalItems={24}
              pageSize={6}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </section>

      {/* Modal Dialog Instance */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Project"
        description="Initialize a new project within your active organization workspace."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setModalOpen(false);
                toast.success('Project Initialized', 'Ready for team assignment.');
              }}
            >
              Create Project
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input id="m-title" label="Project Name" placeholder="e.g. Mobile Redesign" required />
          <Select
            id="m-pri"
            label="Initial Priority"
            options={[
              { label: 'Low Priority', value: 'low' },
              { label: 'Medium Priority', value: 'medium' },
              { label: 'High Priority', value: 'high' },
              { label: 'Urgent', value: 'urgent' },
            ]}
            defaultValue="medium"
          />
          <Textarea id="m-desc" label="Project Scope" rows={3} placeholder="Brief outline..." />
        </div>
      </Modal>

      {/* Confirmation Dialog Instance */}
      <ConfirmationDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          toast.error('Item Deleted', 'The item was deleted.');
        }}
        title="Delete Selected Item"
        message="Are you sure you want to delete this project? This will permanently remove its associated tasks, boards, and files."
        confirmText="Yes, Delete Project"
        variant="destructive"
      />
    </div>
  );
};

export default DesignSystemPage;
