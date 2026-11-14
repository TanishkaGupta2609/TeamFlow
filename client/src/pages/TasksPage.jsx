import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar as CalendarIcon, 
  Filter, 
  ArrowUpDown 
} from 'lucide-react';
import { mockTasks, mockProjects } from '../services/mockData';
import { 
  Button, 
  Input, 
  SearchInput, 
  Select, 
  Tabs, 
  PriorityBadge, 
  StatusBadge, 
  Avatar, 
  Checkbox, 
  Modal, 
  Textarea, 
  useToast, 
  EmptyState 
} from '../components/ui';

export const TasksPage = () => {
  const toast = useToast();
  const [tasks, setTasks] = useState(mockTasks);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newProjId, setNewProjId] = useState(mockProjects[0]?.id || '');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDueDate, setNewDueDate] = useState('2026-11-25');

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    toast.success('Task Updated', 'Completion status updated.');
  };

  const filteredTasks = tasks
    .filter((task) => {
      // Tab filter
      if (activeTab === 'assigned_to_me' && !task.assignedToMe) return false;
      if (activeTab === 'created_by_me' && task.createdBy?.name !== 'Tanishka Gupta') return false;
      if (activeTab === 'overdue' && (task.completed || new Date(task.dueDate) >= new Date())) return false;
      if (activeTab === 'completed' && !task.completed) return false;

      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          task.title.toLowerCase().includes(term) ||
          task.projectName.toLowerCase().includes(term)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') return new Date(a.dueDate) - new Date(b.dueDate);
      if (sortBy === 'priority') {
        const weight = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (weight[b.priority] || 0) - (weight[a.priority] || 0);
      }
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTitle) return;

    const proj = mockProjects.find((p) => p.id === newProjId) || mockProjects[0];
    const newTask = {
      id: `tsk_${Date.now()}`,
      title: newTitle,
      projectId: proj.id,
      projectName: proj.name,
      column: 'todo',
      priority: newPriority,
      assignee: { name: 'Tanishka Gupta', status: 'online' },
      createdBy: { name: 'Tanishka Gupta' },
      dueDate: newDueDate,
      commentCount: 0,
      attachmentCount: 0,
      completed: false,
      assignedToMe: true,
    };

    setTasks([newTask, ...tasks]);
    setCreateModalOpen(false);
    setNewTitle('');
    toast.success('Task Created', `"${newTask.title}" has been added.`);
  };

  const tabsConfig = [
    { id: 'all', label: 'All Tasks', badge: tasks.length },
    { id: 'assigned_to_me', label: 'Assigned to Me', badge: tasks.filter((t) => t.assignedToMe).length },
    { id: 'created_by_me', label: 'Created by Me' },
    { id: 'overdue', label: 'Overdue', badge: tasks.filter((t) => !t.completed && new Date(t.dueDate) < new Date()).length },
    { id: 'completed', label: 'Completed', badge: tasks.filter((t) => t.completed).length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-charcoal">My Tasks</h1>
          <p className="text-xs text-charcoal-secondary mt-1">
            Track and complete your personal and workspace task checklist.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setCreateModalOpen(true)}
        >
          Create Task
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        variant="pill"
        tabs={tabsConfig}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Search and Sort controls */}
      <div className="p-4 bg-white rounded-xl border border-border shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:max-w-md">
          <SearchInput
            placeholder="Search tasks by title or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs text-charcoal-secondary">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort by:</span>
          </div>
          <div className="w-40">
            <Select
              id="sort-tasks"
              options={[
                { label: 'Due Date', value: 'dueDate' },
                { label: 'Priority', value: 'priority' },
                { label: 'Title', value: 'title' },
              ]}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tasks Table / List */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-10">
            <EmptyState
              title="No Tasks Found"
              description="No tasks match the selected tab filter or search query."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveTab('all');
                    setSearchTerm('');
                  }}
                >
                  View All Tasks
                </Button>
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredTasks.map((task) => {
              const isOverdue = !task.completed && new Date(task.dueDate) < new Date();

              return (
                <div
                  key={task.id}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-ivory/50 transition-colors"
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="mt-0.5">
                      <Checkbox
                        id={`task-chk-${task.id}`}
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-xs font-semibold block truncate leading-snug ${
                          task.completed
                            ? 'line-through text-charcoal-secondary'
                            : 'text-charcoal'
                        }`}
                      >
                        {task.title}
                      </span>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-charcoal-secondary">
                        <span className="font-medium text-forest bg-forest/5 px-2 py-0.5 rounded border border-forest/10 truncate max-w-xs">
                          {task.projectName}
                        </span>
                        <span>•</span>
                        <span>Created by {task.createdBy?.name || 'Lead'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <PriorityBadge priority={task.priority} size="sm" />

                    <div
                      className={`flex items-center gap-1.5 text-xs font-mono ${
                        isOverdue ? 'text-status-danger font-semibold' : 'text-charcoal-secondary'
                      }`}
                    >
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>{task.dueDate}</span>
                    </div>

                    <Avatar
                      name={task.assignee?.name}
                      size="xs"
                      status={task.assignee?.status}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Task"
        description="Add a task to your project sprint."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateTask}>
              Create Task
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            id="tk-title"
            label="Task Summary"
            placeholder="e.g. Conduct accessibility audit on forms"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <Select
            id="tk-proj"
            label="Associated Project"
            options={mockProjects.map((p) => ({ label: p.name, value: p.id }))}
            value={newProjId}
            onChange={(e) => setNewProjId(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              id="tk-pri"
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
            <Input
              id="tk-date"
              type="date"
              label="Due Date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TasksPage;
