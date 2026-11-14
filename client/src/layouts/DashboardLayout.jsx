import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchWorkspaces, 
  createWorkspace, 
  setCurrentWorkspace 
} from '../store/workspaceSlice';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Kanban, 
  Calendar as CalendarIcon, 
  Users, 
  BarChart3, 
  Settings as SettingsIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Bell, 
  Search, 
  Menu, 
  X, 
  LogOut, 
  Sparkles,
  Shield,
  Layers,
  Palette
} from 'lucide-react';
import { 
  mockCurrentUser, 
  mockWorkspaces, 
  mockNotifications 
} from '../services/mockData';
import { NotificationDropdown } from '../components/common/NotificationDropdown';
import { 
  Avatar, 
  Button, 
  IconButton, 
  Tooltip, 
  DropdownMenu, 
  useToast, 
  Modal, 
  Input, 
  Select, 
  Textarea 
} from '../components/ui';

export const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const { currentWorkspace, workspaces } = useSelector((state) => state.workspace);
  const activeWorkspace = currentWorkspace || mockWorkspaces[0];

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newProjectModal, setNewProjectModal] = useState(false);
  const [createWorkspaceModal, setCreateWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');
  const [unreadNotifs, setUnreadNotifs] = useState(mockNotifications.filter((n) => !n.read).length);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      const resultAction = await dispatch(
        createWorkspace({ name: newWorkspaceName, description: newWorkspaceDesc })
      );
      if (createWorkspace.fulfilled.match(resultAction)) {
        toast.success('Workspace Created', `Successfully created ${newWorkspaceName}`);
        setCreateWorkspaceModal(false);
        setNewWorkspaceName('');
        setNewWorkspaceDesc('');
      } else {
        toast.error('Creation Failed', resultAction.payload || 'Unable to create workspace');
      }
    } catch (err) {
      toast.error('Error', err.message);
    }
  };

  // Nav links structure
  const workspaceLinks = [
    { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Projects', path: '/projects', icon: <FolderKanban className="w-4 h-4" /> },
    { name: 'My Tasks', path: '/tasks', icon: <CheckSquare className="w-4 h-4" /> },
    { name: 'Kanban Board', path: '/kanban', icon: <Kanban className="w-4 h-4" /> },
    { name: 'Calendar', path: '/calendar', icon: <CalendarIcon className="w-4 h-4" /> },
    { name: 'Team', path: '/team', icon: <Users className="w-4 h-4" /> },
    { name: 'Reports', path: '/reports', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const managementLinks = [
    { name: 'Members', path: '/team', icon: <Users className="w-4 h-4" /> },
    { name: 'Settings', path: '/settings', icon: <SettingsIcon className="w-4 h-4" /> },
  ];

  // Helper for active link checking
  const isActive = (path) => location.pathname === path;

  // Breadcrumb title helper
  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes('/dashboard')) return 'Overview';
    if (p.includes('/projects')) return 'Projects';
    if (p.includes('/tasks')) return 'My Tasks';
    if (p.includes('/kanban')) return 'Kanban Board';
    if (p.includes('/calendar')) return 'Calendar';
    if (p.includes('/team')) return 'Team & Members';
    if (p.includes('/reports')) return 'Reports & Analytics';
    if (p.includes('/settings')) return 'Settings';
    return 'Dashboard';
  };

  const handleCreateProjectSubmit = (e) => {
    e.preventDefault();
    setNewProjectModal(false);
    toast.success('Project Created', 'The new project has been initialized in this workspace.');
  };

  return (
    <div className="min-h-screen bg-ivory text-charcoal flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-border sticky top-0 z-30 shadow-subtle">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-charcoal-secondary hover:text-charcoal hover:bg-ivory"
            aria-label="Open mobile menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="w-7 h-7 rounded-lg bg-forest text-white flex items-center justify-center font-heading font-bold text-xs">
            TF
          </div>
          <span className="font-heading font-bold text-forest text-base tracking-tight">
            TeamFlow
          </span>
        </div>

        <div className="flex items-center gap-2">
          <IconButton
            icon={<Search className="w-4 h-4" />}
            aria-label="Search"
            size="sm"
            onClick={() => setSearchModalOpen(true)}
          />
          <NotificationDropdown />
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-charcoal/50 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar (Desktop Fixed & Mobile Drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-border transition-all duration-200 flex flex-col justify-between shadow-subtle md:translate-x-0 ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
          {/* Workspace Header / Selector */}
          <div className="h-16 px-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-forest flex items-center justify-center text-white font-heading font-bold text-sm shrink-0 shadow-subtle">
                {activeWorkspace.logo}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <DropdownMenu
                    align="left"
                    trigger={
                      <button
                        type="button"
                        className="flex items-center gap-1.5 text-left w-full hover:opacity-80 transition-opacity"
                      >
                        <span className="font-heading font-bold text-xs text-charcoal truncate block">
                          {activeWorkspace.name}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-charcoal-secondary shrink-0" />
                      </button>
                    }
                    items={[
                      ...(workspaces && workspaces.length > 0
                        ? workspaces.map((w) => ({
                            label: w.workspace.name,
                            badge: w.role,
                            onClick: () => {
                              dispatch(setCurrentWorkspace(w.workspace));
                              toast.info('Switched Workspace', `Active workspace set to ${w.workspace.name}`);
                            },
                          }))
                        : mockWorkspaces.map((ws) => ({
                            label: ws.name,
                            badge: ws.role,
                            onClick: () => {
                              dispatch(setCurrentWorkspace(ws));
                              toast.info('Switched Workspace', `Active workspace set to ${ws.name}`);
                            },
                          }))),
                      {
                        label: '+ Create Workspace',
                        onClick: () => setCreateWorkspaceModal(true),
                      },
                    ]}
                  />
                </div>
              )}
            </div>

            {/* Mobile close button / Desktop collapse toggle */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="md:hidden p-1 text-charcoal-secondary hover:text-charcoal rounded"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="hidden md:flex p-1 text-charcoal-secondary hover:text-charcoal hover:bg-ivory rounded transition-colors"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Create Project Button */}
          <div className="p-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setNewProjectModal(true)}
              className={`w-full ${collapsed ? 'px-0 justify-center' : ''}`}
              leftIcon={<Plus className="w-4 h-4 shrink-0" />}
            >
              {!collapsed && <span>Create Project</span>}
            </Button>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-2 space-y-6">
            {/* WORKSPACE group */}
            <div>
              {!collapsed && (
                <span className="px-2.5 text-[10px] font-bold text-charcoal-secondary/70 tracking-wider uppercase">
                  Workspace
                </span>
              )}
              <nav className="mt-1 space-y-0.5">
                {workspaceLinks.map((item) => {
                  const active = isActive(item.path);
                  const content = (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                        active
                          ? 'bg-forest/10 text-forest shadow-xs'
                          : 'text-charcoal-secondary hover:text-charcoal hover:bg-ivory'
                      } ${collapsed ? 'justify-center px-0' : ''}`}
                    >
                      <span className={`shrink-0 ${active ? 'text-forest' : 'text-charcoal-secondary'}`}>
                        {item.icon}
                      </span>
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  );

                  return collapsed ? (
                    <Tooltip key={item.path} content={item.name} position="right">
                      {content}
                    </Tooltip>
                  ) : (
                    content
                  );
                })}
              </nav>
            </div>

            {/* WORKSPACE MANAGEMENT group */}
            <div>
              {!collapsed && (
                <span className="px-2.5 text-[10px] font-bold text-charcoal-secondary/70 tracking-wider uppercase">
                  Workspace Management
                </span>
              )}
              <nav className="mt-1 space-y-0.5">
                {managementLinks.map((item) => {
                  const active = isActive(item.path);
                  const content = (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                        active
                          ? 'bg-forest/10 text-forest shadow-xs'
                          : 'text-charcoal-secondary hover:text-charcoal hover:bg-ivory'
                      } ${collapsed ? 'justify-center px-0' : ''}`}
                    >
                      <span className={`shrink-0 ${active ? 'text-forest' : 'text-charcoal-secondary'}`}>
                        {item.icon}
                      </span>
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  );

                  return collapsed ? (
                    <Tooltip key={item.name} content={item.name} position="right">
                      {content}
                    </Tooltip>
                  ) : (
                    content
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* User Account Section at Bottom */}
        <div className="p-3 border-t border-border bg-ivory/40">
          <DropdownMenu
            align="right"
            trigger={
              <button
                type="button"
                className={`w-full flex items-center gap-3 p-1.5 rounded-lg hover:bg-ivory transition-colors text-left ${
                  collapsed ? 'justify-center' : ''
                }`}
              >
                <Avatar
                  name={mockCurrentUser.name}
                  size="sm"
                  status={mockCurrentUser.status}
                />
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-charcoal truncate">
                      {mockCurrentUser.name}
                    </p>
                    <p className="text-[11px] text-charcoal-secondary truncate">
                      {mockCurrentUser.email}
                    </p>
                  </div>
                )}
              </button>
            }
            items={[
              { label: 'View Profile', onClick: () => navigate('/settings') },
              { label: 'Workspace Settings', onClick: () => navigate('/settings') },
              { label: 'UI Design System', icon: <Palette className="w-3.5 h-3.5" />, onClick: () => navigate('/design-system') },
              { type: 'divider' },
              {
                label: 'Sign Out',
                icon: <LogOut className="w-3.5 h-3.5" />,
                danger: true,
                onClick: () => {
                  toast.info('Signed Out', 'Redirecting to login...');
                  navigate('/login');
                },
              },
            ]}
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          collapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Top Desktop Navigation Bar */}
        <header className="hidden md:flex h-16 bg-white border-b border-border sticky top-0 z-30 px-6 sm:px-8 items-center justify-between shadow-subtle">
          {/* Breadcrumb / Title */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-heading font-medium text-charcoal-secondary">
              {activeWorkspace.name}
            </span>
            <span className="text-charcoal-secondary">/</span>
            <h1 className="font-heading font-bold text-charcoal text-sm">
              {getPageTitle()}
            </h1>
          </div>

          {/* Top Actions: Search, Notifications, Health */}
          <div className="flex items-center gap-3">
            {/* Global Search Bar */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="flex items-center gap-2 w-64 h-9 px-3 bg-ivory rounded-input border border-border text-xs text-charcoal-secondary hover:border-charcoal-secondary/50 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-charcoal-secondary" />
              <span>Search projects, tasks, team...</span>
              <kbd className="ml-auto text-[10px] bg-white border border-border px-1.5 py-0.5 rounded font-mono text-charcoal-secondary">
                ⌘K
              </kbd>
            </button>

            {/* Notifications Dropdown */}
            <NotificationDropdown />
          </div>
        </header>

        {/* Dynamic Route Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Modal: Create Project */}
      <Modal
        isOpen={newProjectModal}
        onClose={() => setNewProjectModal(false)}
        title="Create New Project"
        description={`Add a new project to ${activeWorkspace.name}`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setNewProjectModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateProjectSubmit}>
              Create Project
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
          <Input id="p-name" label="Project Name" placeholder="e.g. Mobile App Redesign" required />
          <Input id="p-key" label="Project Key" placeholder="e.g. MAR" helperText="Short uppercase prefix for task IDs" required />
          <Select
            id="p-priority"
            label="Priority Level"
            options={[
              { label: 'Low Priority', value: 'low' },
              { label: 'Medium Priority', value: 'medium' },
              { label: 'High Priority', value: 'high' },
              { label: 'Urgent', value: 'urgent' },
            ]}
            defaultValue="medium"
          />
          <Textarea id="p-desc" label="Project Description" rows={3} placeholder="Describe the objectives and scope..." />
        </form>
      </Modal>

      {/* Modal: Create Workspace */}
      <Modal
        isOpen={createWorkspaceModal}
        onClose={() => setCreateWorkspaceModal(false)}
        title="Create Organization Workspace"
        description="Establish a new workspace for your company or team projects"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setCreateWorkspaceModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateWorkspace}>
              Create Workspace
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <Input
            id="ws-create-name"
            label="Workspace Name"
            placeholder="e.g. Acme Innovations"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            required
            autoFocus
          />
          <Textarea
            id="ws-create-desc"
            label="Description (Optional)"
            rows={3}
            placeholder="What does this organization or department work on?"
            value={newWorkspaceDesc}
            onChange={(e) => setNewWorkspaceDesc(e.target.value)}
          />
        </form>
      </Modal>

      {/* Modal: Global Search */}
      <Modal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        title="Global Search"
        size="md"
      >
        <div className="space-y-4">
          <Input
            id="g-search"
            placeholder="Type project, task name, or teammate..."
            leftIcon={<Search className="w-4 h-4" />}
            value={globalSearchTerm}
            onChange={(e) => setGlobalSearchTerm(e.target.value)}
            autoFocus
          />
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-charcoal-secondary uppercase tracking-wider">
              Quick Suggestions
            </span>
            <div className="divide-y divide-border border border-border rounded-lg bg-ivory/50">
              <button
                type="button"
                onClick={() => {
                  setSearchModalOpen(false);
                  navigate('/projects');
                }}
                className="w-full p-2.5 text-left text-xs flex items-center justify-between hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-3.5 h-3.5 text-forest" />
                  <span className="font-semibold text-charcoal">SaaS Workspace Redesign</span>
                </div>
                <span className="text-[10px] text-charcoal-secondary font-mono">Project</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchModalOpen(false);
                  navigate('/kanban');
                }}
                className="w-full p-2.5 text-left text-xs flex items-center justify-between hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Kanban className="w-3.5 h-3.5 text-amber-accent" />
                  <span className="font-semibold text-charcoal">Design high-contrast Kanban column headers</span>
                </div>
                <span className="text-[10px] text-charcoal-secondary font-mono">Task</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardLayout;
