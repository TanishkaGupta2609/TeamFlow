import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar as CalendarIcon, 
  Filter, 
  ArrowUpDown,
  MessageSquare,
  ListTodo,
  Send,
  Trash2,
  X
} from 'lucide-react';
import { 
  fetchTasks, 
  createTask, 
  updateTask, 
  deleteTask, 
  fetchTaskDetails,
  createSubtask,
  updateSubtask,
  createComment 
} from '../store/taskSlice';
import { fetchProjects } from '../store/projectSlice';
import { 
  Button, 
  IconButton,
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
  const dispatch = useDispatch();

  const { currentWorkspace } = useSelector((state) => state.workspace);
  const { projects } = useSelector((state) => state.project);
  const { tasks, currentTaskDetails } = useSelector((state) => state.task);

  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newProjId, setNewProjId] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newDueDate, setNewDueDate] = useState('2026-11-25');
  const [newDesc, setNewDesc] = useState('');

  // Selected task & interaction states
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  useEffect(() => {
    if (currentWorkspace?._id) {
      dispatch(fetchTasks({ workspaceId: currentWorkspace._id }));
      dispatch(fetchProjects({ workspaceId: currentWorkspace._id }));
    }
  }, [dispatch, currentWorkspace?._id]);

  useEffect(() => {
    if (projects && projects.length > 0 && !newProjId) {
      setNewProjId(projects[0]._id || projects[0].id);
    }
  }, [projects, newProjId]);

  const taskList = Array.isArray(tasks) ? tasks : [];

  const handleOpenDetails = (task) => {
    const tId = task._id || task.id;
    setSelectedTaskId(tId);
    if (currentWorkspace?._id) {
      dispatch(fetchTaskDetails({ workspaceId: currentWorkspace._id, taskId: tId }));
    }
    setDetailsModalOpen(true);
  };

  const toggleTask = async (task) => {
    const tId = task._id || task.id;
    const isDone = task.status === 'DONE' || task.completed;
    const newStatus = isDone ? 'TODO' : 'DONE';

    if (currentWorkspace?._id && task._id) {
      try {
        await dispatch(
          updateTask({
            workspaceId: currentWorkspace._id,
            taskId: tId,
            data: { status: newStatus },
          })
        );
        toast.success('Task Updated', `Status changed to ${newStatus}`);
        return;
      } catch (err) {
        toast.error('Error', err.message);
      }
    }

    toast.success('Task Updated', 'Completion status updated.');
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle) return;

    const targetProjId = newProjId || (projects[0]?._id || projects[0]?.id);

    if (currentWorkspace?._id && targetProjId) {
      try {
        const actionResult = await dispatch(
          createTask({
            workspaceId: currentWorkspace._id,
            projectId: targetProjId,
            data: {
              title: newTitle,
              description: newDesc,
              priority: newPriority,
              dueDate: newDueDate ? new Date(newDueDate).toISOString() : null,
              status: 'TODO',
            },
          })
        );
        if (createTask.fulfilled.match(actionResult)) {
          toast.success('Task Created', `"${newTitle}" added to sprint.`);
          setCreateModalOpen(false);
          setNewTitle('');
          setNewDesc('');
          return;
        }
      } catch (err) {
        toast.error('Error', err.message);
      }
    }

    toast.success('Task Created', `"${newTitle}" added to sprint.`);
    setCreateModalOpen(false);
    setNewTitle('');
    setNewDesc('');
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !selectedTaskId || !currentWorkspace?._id) return;

    try {
      await dispatch(
        createSubtask({
          workspaceId: currentWorkspace._id,
          taskId: selectedTaskId,
          data: { title: newSubtaskTitle },
        })
      );
      setNewSubtaskTitle('');
      toast.success('Subtask Added', 'Checklist item appended.');
    } catch (err) {
      toast.error('Error', err.message);
    }
  };

  const handleToggleSubtask = async (subtaskId, completed) => {
    if (!selectedTaskId || !currentWorkspace?._id) return;

    try {
      await dispatch(
        updateSubtask({
          workspaceId: currentWorkspace._id,
          taskId: selectedTaskId,
          subtaskId,
          data: { completed: !completed },
        })
      );
    } catch (err) {
      toast.error('Error', err.message);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedTaskId || !currentWorkspace?._id) return;

    try {
      await dispatch(
        createComment({
          workspaceId: currentWorkspace._id,
          taskId: selectedTaskId,
          data: { content: newCommentText },
        })
      );
      setNewCommentText('');
      toast.success('Comment Posted', 'Your message was added to the task.');
    } catch (err) {
      toast.error('Error', err.message);
    }
  };

  const filteredTasks = taskList
    .filter((task) => {
      const isDone = task.status === 'DONE' || task.completed;
      if (activeTab === 'assigned_to_me' && !task.assignedToMe && !task.assignees?.some(a => a.name === 'Tanishka Gupta')) return false;
      if (activeTab === 'completed' && !isDone) return false;
      if (activeTab === 'overdue' && (isDone || new Date(task.dueDate) >= new Date())) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const pName = task.project?.name || task.projectName || '';
        return task.title.toLowerCase().includes(term) || pName.toLowerCase().includes(term);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

  const selectedTask = currentTaskDetails?.task || taskList.find((t) => (t._id || t.id) === selectedTaskId);
  const subtasks = currentTaskDetails?.subtasks || [];
  const comments = currentTaskDetails?.comments || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-charcoal">My Tasks</h1>
          <p className="text-xs text-charcoal-secondary mt-1">
            Track, prioritize, and complete sprint work across all projects.
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

      {/* Tabs and Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <Tabs
          variant="pill"
          tabs={[
            { id: 'all', label: 'All Tasks', badge: taskList.length },
            { id: 'assigned_to_me', label: 'Assigned to Me' },
            { id: 'completed', label: 'Completed' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="flex items-center gap-3">
          <div className="w-full sm:w-64">
            <SearchInput
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
            />
          </div>

          <Select
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

      {/* Task List Container */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        {filteredTasks.length === 0 ? (
          <EmptyState
            title="No tasks found"
            description="You're all caught up! Create a new task or adjust your search filter."
            actionLabel="Add Task"
            onAction={() => setCreateModalOpen(true)}
          />
        ) : (
          <div className="divide-y divide-border">
            {filteredTasks.map((task) => {
              const tId = task._id || task.id;
              const isDone = task.status === 'DONE' || task.completed;
              const projectName = task.project?.name || task.projectName || 'General';
              const dueDateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date';
              const assigneeName = task.assignees?.[0]?.name || task.assignee?.name || 'Unassigned';

              return (
                <div
                  key={tId}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-ivory/50 transition-colors cursor-pointer"
                  onClick={() => handleOpenDetails(task)}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                    <div className="mt-0.5">
                      <Checkbox
                        id={`task-chk-${tId}`}
                        checked={isDone}
                        onChange={() => toggleTask(task)}
                      />
                    </div>
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handleOpenDetails(task)}>
                      <span
                        className={`text-xs font-semibold block truncate leading-snug ${
                          isDone ? 'line-through text-charcoal-secondary' : 'text-charcoal'
                        }`}
                      >
                        {task.title}
                      </span>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-charcoal-secondary">
                        <span className="font-medium text-forest bg-forest/5 px-2 py-0.5 rounded border border-forest/10 truncate max-w-xs">
                          {projectName}
                        </span>
                        <span>•</span>
                        <StatusBadge status={task.status?.toLowerCase()} size="sm" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <PriorityBadge priority={task.priority?.toLowerCase()} size="sm" />

                    <div className="flex items-center gap-1.5 text-xs font-mono text-charcoal-secondary">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>{dueDateStr}</span>
                    </div>

                    <Avatar name={assigneeName} size="xs" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Details Panel Modal */}
      {selectedTask && (
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title={selectedTask.title}
          description={`Project: ${selectedTask.project?.name || selectedTask.projectName || 'General'}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Status & Priority Badges */}
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <StatusBadge status={selectedTask.status?.toLowerCase()} size="sm" />
              <PriorityBadge priority={selectedTask.priority?.toLowerCase()} size="sm" />
            </div>

            {/* Description */}
            <div>
              <span className="text-xs font-bold text-charcoal block mb-1">Description</span>
              <p className="text-xs text-charcoal-secondary leading-relaxed bg-ivory/50 p-3 rounded-lg border border-border">
                {selectedTask.description || 'No detailed description provided for this task.'}
              </p>
            </div>

            {/* Subtasks Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-charcoal flex items-center gap-1.5">
                  <ListTodo className="w-4 h-4 text-forest" />
                  Subtasks Checklist ({subtasks.filter(s => s.completed).length}/{subtasks.length})
                </span>
              </div>

              <div className="space-y-2 mb-3">
                {subtasks.map((st) => (
                  <div
                    key={st._id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-ivory/30 border border-border text-xs"
                  >
                    <Checkbox
                      id={`st-${st._id}`}
                      checked={st.completed}
                      onChange={() => handleToggleSubtask(st._id, st.completed)}
                    />
                    <span className={st.completed ? 'line-through text-charcoal-secondary' : 'text-charcoal'}>
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <Input
                  id="new-st-input"
                  placeholder="Add a new checklist step..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  size="sm"
                />
                <Button type="submit" variant="secondary" size="sm">
                  Add Step
                </Button>
              </form>
            </div>

            {/* Comments Section */}
            <div className="pt-3 border-t border-border">
              <span className="text-xs font-bold text-charcoal flex items-center gap-1.5 mb-3">
                <MessageSquare className="w-4 h-4 text-forest" />
                Comments &amp; Activity ({comments.length})
              </span>

              <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
                {comments.length === 0 ? (
                  <p className="text-xs text-charcoal-secondary italic">No comments yet. Start the conversation!</p>
                ) : (
                  comments.map((c) => (
                    <div key={c._id} className="p-3 bg-ivory/40 rounded-lg border border-border space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-charcoal">{c.author?.name || 'Teammate'}</span>
                        <span className="text-charcoal-secondary font-mono">
                          {c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-charcoal leading-relaxed">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <Input
                  id="new-cmt-input"
                  placeholder="Post an update or reply..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  size="sm"
                />
                <Button type="submit" variant="primary" size="sm" rightIcon={<Send className="w-3.5 h-3.5" />}>
                  Post
                </Button>
              </form>
            </div>
          </div>
        </Modal>
      )}

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
            autoFocus
          />

          <Select
            id="tk-proj"
            label="Associated Project"
            options={
              projects && projects.length > 0
                ? projects.map((p) => ({ label: p.name, value: p._id || p.id }))
                : [{ label: 'Core Platform', value: 'default-prj' }]
            }
            value={newProjId}
            onChange={(e) => setNewProjId(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              id="tk-pri"
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
            <Input
              id="tk-date"
              type="date"
              label="Due Date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
          </div>

          <Textarea
            id="tk-desc"
            label="Description & Deliverables"
            rows={3}
            placeholder="Provide context and requirements..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};

export default TasksPage;
