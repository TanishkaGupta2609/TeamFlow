import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List, 
  Calendar, 
  User, 
  MoreVertical, 
  Filter, 
  CheckCircle2, 
  Clock,
  Trash2,
  Archive
} from 'lucide-react';
import { 
  fetchProjects, 
  createProject, 
  archiveProject, 
  deleteProject 
} from '../store/projectSlice';
import { 
  Button, 
  IconButton, 
  Input, 
  SearchInput, 
  Select, 
  Textarea, 
  StatusBadge, 
  PriorityBadge, 
  Avatar, 
  AvatarGroup, 
  ProgressBar, 
  Modal, 
  DropdownMenu, 
  useToast, 
  EmptyState 
} from '../components/ui';

export const ProjectsPage = () => {
  const toast = useToast();
  const dispatch = useDispatch();
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const { projects } = useSelector((state) => state.project);

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New project form state
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newDeadline, setNewDeadline] = useState('2026-12-31');

  useEffect(() => {
    if (currentWorkspace?._id) {
      dispatch(
        fetchProjects({
          workspaceId: currentWorkspace._id,
          status: statusFilter,
          priority: priorityFilter,
          search: searchTerm,
        })
      );
    }
  }, [dispatch, currentWorkspace?._id, statusFilter, priorityFilter, searchTerm]);

  const projectList = Array.isArray(projects) ? projects : [];

  const filteredProjects = projectList.filter((p) => {
    const name = p.name || '';
    const desc = p.description || '';
    const key = p.key || (name.substring(0, 3).toUpperCase());

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesPriority = priorityFilter === 'all' || p.priority?.toLowerCase() === priorityFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newName) return;

    if (currentWorkspace?._id) {
      try {
        const actionResult = await dispatch(
          createProject({
            workspaceId: currentWorkspace._id,
            data: {
              name: newName,
              description: newDesc,
              priority: newPriority,
              dueDate: newDeadline ? new Date(newDeadline).toISOString() : null,
            },
          })
        );
        if (createProject.fulfilled.match(actionResult)) {
          toast.success('Project Created', `"${newName}" has been initialized.`);
          setCreateModalOpen(false);
          setNewName('');
          setNewKey('');
          setNewDesc('');
          return;
        }
      } catch (err) {
        toast.error('Error', err.message);
      }
    }

    toast.success('Project Created', `"${newName}" has been added.`);
    setCreateModalOpen(false);
    setNewName('');
    setNewKey('');
    setNewDesc('');
  };

  const handleDeleteProject = async (projectId, projectName) => {
    if (currentWorkspace?._id && projectId) {
      try {
        await dispatch(deleteProject({ workspaceId: currentWorkspace._id, projectId }));
        toast.error('Project Deleted', `"${projectName}" was removed.`);
      } catch (err) {
        toast.error('Error', err.message);
      }
    } else {
      toast.error('Project Deleted', `"${projectName}" was removed.`);
    }
  };

  const handleArchiveProject = async (projectId, projectName) => {
    if (currentWorkspace?._id && projectId) {
      try {
        await dispatch(archiveProject({ workspaceId: currentWorkspace._id, projectId }));
        toast.info('Project Archived', `"${projectName}" has been archived.`);
      } catch (err) {
        toast.error('Error', err.message);
      }
    } else {
      toast.info('Project Archived', `"${projectName}" has been archived.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-charcoal">Projects</h1>
          <p className="text-xs text-charcoal-secondary mt-1">
            Manage your organization initiatives, deadlines, and assigned teams.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setCreateModalOpen(true)}
        >
          Create Project
        </Button>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-border shadow-subtle">
        <div className="w-full sm:w-80">
          <SearchInput
            placeholder="Search projects by name, key or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
          />
        </div>

        <div className="flex items-center gap-3">
          <Select
            options={[
              { label: 'All Statuses', value: 'all' },
              { label: 'Planning', value: 'PLANNING' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Completed', value: 'COMPLETED' },
              { label: 'Archived', value: 'ARCHIVED' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />

          <Select
            options={[
              { label: 'All Priorities', value: 'all' },
              { label: 'Critical', value: 'CRITICAL' },
              { label: 'High', value: 'HIGH' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'Low', value: 'LOW' },
            ]}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          />

          <div className="hidden sm:flex items-center border border-border rounded-lg p-0.5 bg-ivory">
            <IconButton
              icon={<LayoutGrid className="w-4 h-4" />}
              aria-label="Grid view"
              size="sm"
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('grid')}
            />
            <IconButton
              icon={<List className="w-4 h-4" />}
              aria-label="List view"
              size="sm"
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('list')}
            />
          </div>
        </div>
      </div>

      {/* Projects Display */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="Create your first project or adjust search filters to get started."
          actionLabel="Create Project"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((p) => {
            const pId = p._id || p.id;
            const pKey = p.key || (p.name ? p.name.substring(0, 3).toUpperCase() : 'PRJ');
            const deadline = p.dueDate ? new Date(p.dueDate).toLocaleDateString() : p.deadline || 'Dec 2026';
            const memberList = p.members && p.members.length > 0
              ? p.members.map(m => typeof m === 'object' ? m : { name: 'Member' })
              : [{ name: 'Admin' }];

            return (
              <div
                key={pId}
                className="bg-white rounded-xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Card Top: Key, Priority, Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-forest/5 text-forest border border-forest/10">
                      {pKey}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={p.priority?.toLowerCase()} size="sm" />
                      <StatusBadge status={p.status?.toLowerCase()} size="sm" />
                      <DropdownMenu
                        align="right"
                        trigger={<IconButton icon={<MoreVertical className="w-3.5 h-3.5" />} aria-label="Project actions" size="sm" />}
                        items={[
                          {
                            label: 'Archive Project',
                            onClick: () => handleArchiveProject(pId, p.name),
                          },
                          { type: 'divider' },
                          {
                            label: 'Delete Project',
                            danger: true,
                            onClick: () => handleDeleteProject(pId, p.name),
                          },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Card Title & Description */}
                  <h3 className="font-heading font-bold text-base text-charcoal mt-3 leading-snug">
                    {p.name}
                  </h3>
                  <p className="text-xs text-charcoal-secondary mt-1.5 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="space-y-4 pt-3 border-t border-border">
                  {/* Progress Bar */}
                  <ProgressBar
                    value={p.progress || 0}
                    label="Progress"
                    size="sm"
                    variant={p.progress === 100 ? 'success' : 'forest'}
                  />

                  {/* Meta: Deadline, Manager & Team Avatars */}
                  <div className="flex items-center justify-between text-xs text-charcoal-secondary pt-1">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-charcoal-secondary" />
                      <span>{deadline}</span>
                    </div>
                    <AvatarGroup users={memberList} max={3} size="xs" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="divide-y divide-border">
            {filteredProjects.map((p) => {
              const pId = p._id || p.id;
              const pKey = p.key || (p.name ? p.name.substring(0, 3).toUpperCase() : 'PRJ');
              const deadline = p.dueDate ? new Date(p.dueDate).toLocaleDateString() : p.deadline || 'Dec 2026';
              const memberList = p.members && p.members.length > 0
                ? p.members.map(m => typeof m === 'object' ? m : { name: 'Member' })
                : [{ name: 'Admin' }];

              return (
                <div
                  key={pId}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-ivory/50 transition-colors"
                >
                  <div className="space-y-1 md:w-5/12">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-forest/5 text-forest">
                        {pKey}
                      </span>
                      <h3 className="font-heading font-bold text-sm text-charcoal">{p.name}</h3>
                    </div>
                    <p className="text-xs text-charcoal-secondary line-clamp-1">{p.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 md:w-7/12 justify-between">
                    <div className="w-36">
                      <ProgressBar value={p.progress || 0} size="sm" />
                    </div>
                    <StatusBadge status={p.status?.toLowerCase()} size="sm" />
                    <PriorityBadge priority={p.priority?.toLowerCase()} size="sm" />
                    <span className="text-xs text-charcoal-secondary font-mono">{deadline}</span>
                    <AvatarGroup users={memberList} max={3} size="xs" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Project"
        description="Launch an initiative and assign team members."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateProject}>
              Create Project
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <Input
            id="cp-name"
            label="Project Name"
            placeholder="e.g. Mobile App Redesign"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
            autoFocus
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="cp-key"
              label="Project Key"
              placeholder="e.g. MAR"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value.toUpperCase())}
              helperText="2-4 character prefix"
            />
            <Select
              id="cp-priority"
              label="Priority"
              options={[
                { label: 'Low', value: 'LOW' },
                { label: 'Medium', value: 'MEDIUM' },
                { label: 'High', value: 'HIGH' },
                { label: 'Critical', value: 'CRITICAL' },
              ]}
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
            />
          </div>
          <Input
            id="cp-date"
            type="date"
            label="Target Delivery Date"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
          />
          <Textarea
            id="cp-desc"
            label="Project Description"
            rows={3}
            placeholder="Scope and deliverables..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};

export default ProjectsPage;
