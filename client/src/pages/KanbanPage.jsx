import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Paperclip, 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  MoreHorizontal,
  FolderKanban
} from 'lucide-react';
import { mockTasks, mockProjects } from '../services/mockData';
import { 
  Button, 
  IconButton, 
  PriorityBadge, 
  Avatar, 
  Modal, 
  Input, 
  Select, 
  useToast, 
  DropdownMenu 
} from '../components/ui';

export const KanbanPage = () => {
  const toast = useToast();
  const [tasks, setTasks] = useState(mockTasks);
  const [selectedProject, setSelectedProject] = useState('all');
  const [addTaskColumn, setAddTaskColumn] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('medium');

  const columns = [
    { id: 'backlog', title: 'Backlog', color: 'border-charcoal-secondary/30' },
    { id: 'todo', title: 'To Do', color: 'border-sage-dark' },
    { id: 'in_progress', title: 'In Progress', color: 'border-forest' },
    { id: 'review', title: 'In Review', color: 'border-amber-accent' },
    { id: 'done', title: 'Done', color: 'border-status-success' },
  ];

  const filteredTasks = selectedProject === 'all'
    ? tasks
    : tasks.filter((t) => t.projectId === selectedProject);

  const moveTask = (taskId, direction) => {
    const columnOrder = ['backlog', 'todo', 'in_progress', 'review', 'done'];
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const currIdx = columnOrder.indexOf(t.column);
        const nextIdx = direction === 'next' ? currIdx + 1 : currIdx - 1;
        if (nextIdx >= 0 && nextIdx < columnOrder.length) {
          const nextCol = columnOrder[nextIdx];
          toast.info('Task Moved', `Moved to ${nextCol.replace('_', ' ').toUpperCase()}`);
          return { ...t, column: nextCol, completed: nextCol === 'done' };
        }
        return t;
      })
    );
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTitle) return;

    const newTask = {
      id: `tsk_${Date.now()}`,
      title: newTitle,
      projectId: mockProjects[0].id,
      projectName: mockProjects[0].name,
      column: addTaskColumn || 'todo',
      priority: newPriority,
      assignee: { name: 'Tanishka Gupta', status: 'online' },
      dueDate: '2026-12-01',
      commentCount: 0,
      attachmentCount: 0,
      completed: addTaskColumn === 'done',
      assignedToMe: true,
    };

    setTasks([...tasks, newTask]);
    setAddTaskColumn(null);
    setNewTitle('');
    toast.success('Task Added', `Task added to ${newTask.column}.`);
  };

  return (
    <div className="space-y-6">
      {/* Kanban Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-charcoal">Kanban Board</h1>
          <p className="text-xs text-charcoal-secondary mt-1">
            Visual workflow and status progression across all sprint tasks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-48">
            <Select
              id="kb-proj"
              options={[
                { label: 'All Projects', value: 'all' },
                ...mockProjects.map((p) => ({ label: p.name, value: p.id })),
              ]}
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            />
          </div>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setAddTaskColumn('todo')}
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.column === col.id);

          return (
            <div
              key={col.id}
              className={`bg-white rounded-xl border border-border shadow-card flex flex-col max-h-[calc(100vh-14rem)] overflow-hidden border-t-4 ${col.color}`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-border flex items-center justify-between bg-ivory/30">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-xs text-charcoal uppercase tracking-wider">
                    {col.title}
                  </h3>
                  <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-border text-charcoal-secondary">
                    {colTasks.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAddTaskColumn(col.id)}
                  className="p-1 rounded text-charcoal-secondary hover:text-charcoal hover:bg-white transition-colors"
                  aria-label={`Add task to ${col.title}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Column Tasks */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1 min-h-[160px]">
                {colTasks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-charcoal-secondary/60 border border-dashed border-border rounded-lg">
                    No tasks in {col.title}
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 bg-white rounded-lg border border-border hover:border-forest/40 shadow-subtle transition-all duration-150 space-y-2.5 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <PriorityBadge priority={task.priority} size="sm" />
                        <span className="text-[10px] text-charcoal-secondary font-mono">
                          {task.dueDate}
                        </span>
                      </div>

                      <h4 className="font-heading font-semibold text-xs text-charcoal leading-snug">
                        {task.title}
                      </h4>

                      <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-charcoal-secondary">
                        <div className="flex items-center gap-2.5">
                          {task.commentCount > 0 && (
                            <span className="flex items-center gap-1 text-[11px]">
                              <MessageSquare className="w-3 h-3" />
                              {task.commentCount}
                            </span>
                          )}
                          {task.attachmentCount > 0 && (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Paperclip className="w-3 h-3" />
                              {task.attachmentCount}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Column shift triggers */}
                          <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity">
                            {col.id !== 'backlog' && (
                              <button
                                type="button"
                                onClick={() => moveTask(task.id, 'prev')}
                                className="p-0.5 text-charcoal-secondary hover:text-charcoal"
                                title="Move back"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {col.id !== 'done' && (
                              <button
                                type="button"
                                onClick={() => moveTask(task.id, 'next')}
                                className="p-0.5 text-charcoal-secondary hover:text-charcoal"
                                title="Move forward"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <Avatar
                            name={task.assignee?.name}
                            size="xs"
                            status={task.assignee?.status}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task to Column Modal */}
      <Modal
        isOpen={!!addTaskColumn}
        onClose={() => setAddTaskColumn(null)}
        title={`Add Task to ${addTaskColumn?.toUpperCase()}`}
        description="Quickly draft and assign a task on the board."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setAddTaskColumn(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddTask}>
              Add to Board
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddTask} className="space-y-4">
          <Input
            id="kb-task-title"
            label="Task Name"
            placeholder="e.g. Audit responsive breakpoints"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
            autoFocus
          />

          <Select
            id="kb-task-pri"
            label="Priority Level"
            options={[
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
              { label: 'Urgent', value: 'urgent' },
            ]}
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};

export default KanbanPage;
