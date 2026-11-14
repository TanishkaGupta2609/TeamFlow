import React, { useState } from 'react';
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
  Clock 
} from 'lucide-react';
import { mockProjects } from '../services/mockData';
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
  const [projects, setProjects] = useState(mockProjects);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New project form state
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDeadline, setNewDeadline] = useState('2026-12-31');

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || p.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newName) return;

    const newProj = {
      id: `prj_${Date.now()}`,
      name: newName,
      key: newKey || newName.substring(0, 3).toUpperCase(),
      description: newDesc || 'Project description pending.',
      status: 'planning',
      priority: newPriority,
      progress: 0,
      deadline: newDeadline,
      manager: { name: 'Tanishka Gupta', status: 'online' },
      members: [{ name: 'Tanishka Gupta', status: 'online' }],
      taskCounts: { total: 0, completed: 0, inProgress: 0, pending: 0 },
    };

    setProjects([newProj, ...projects]);
    setCreateModalOpen(false);
    setNewName('');
    setNewKey('');
    setNewDesc('');
    toast.success('Project Created', `"${newProj.name}" has been added.`);
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

      {/* Control Bar: Search, Filters, View Mode Toggle */}
      <div className="p-4 bg-white rounded-xl border border-border shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full md:max-w-md">
          <SearchInput
            placeholder="Search projects by name, description, key..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Status Filter */}
          <div className="w-36">
            <Select
              id="filter-status"
              options={[
                { label: 'All Statuses', value: 'all' },
                { label: 'In Progress', value: 'in_progress' },
                { label: 'Active', value: 'active' },
                { label: 'Review', value: 'review' },
                { label: 'Completed', value: 'completed' },
                { label: 'Planning', value: 'planning' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>

          {/* Priority Filter */}
          <div className="w-36">
            <Select
              id="filter-priority"
              options={[
                { label: 'All Priorities', value: 'all' },
                { label: 'Urgent', value: 'urgent' },
                { label: 'High', value: 'high' },
                { label: 'Medium', value: 'medium' },
                { label: 'Low', value: 'low' },
              ]}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-btn p-0.5 bg-ivory">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded text-charcoal transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-subtle text-forest' : 'text-charcoal-secondary hover:text-charcoal'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded text-charcoal transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-subtle text-forest' : 'text-charcoal-secondary hover:text-charcoal'
              }`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Content: Grid or List */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          title="No Projects Match Your Filter"
          description="Try adjusting your search term or status filters to discover projects."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-border p-6 shadow-card hover:border-forest/30 transition-all duration-150 flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Card Top: Key, Priority, Status */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-forest/5 text-forest border border-forest/10">
                    {p.key}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <PriorityBadge priority={p.priority} size="sm" />
                    <StatusBadge status={p.status} size="sm" />
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
                  value={p.progress}
                  label="Progress"
                  size="sm"
                  variant={p.progress === 100 ? 'success' : 'forest'}
                />

                {/* Meta: Deadline, Manager & Team Avatars */}
                <div className="flex items-center justify-between text-xs text-charcoal-secondary pt-1">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-charcoal-secondary" />
                    <span>{p.deadline}</span>
                  </div>
                  <AvatarGroup users={p.members} max={3} size="xs" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="divide-y divide-border">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-ivory/50 transition-colors"
              >
                <div className="space-y-1 md:w-5/12">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-forest/5 text-forest">
                      {p.key}
                    </span>
                    <h3 className="font-heading font-bold text-sm text-charcoal">{p.name}</h3>
                  </div>
                  <p className="text-xs text-charcoal-secondary line-clamp-1">{p.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-6 md:w-7/12 justify-between">
                  <div className="w-36">
                    <ProgressBar value={p.progress} size="sm" />
                  </div>
                  <StatusBadge status={p.status} size="sm" />
                  <PriorityBadge priority={p.priority} size="sm" />
                  <span className="text-xs text-charcoal-secondary font-mono">{p.deadline}</span>
                  <AvatarGroup users={p.members} max={3} size="xs" />
                </div>
              </div>
            ))}
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
                { label: 'Low', value: 'low' },
                { label: 'Medium', value: 'medium' },
                { label: 'High', value: 'high' },
                { label: 'Urgent', value: 'urgent' },
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
