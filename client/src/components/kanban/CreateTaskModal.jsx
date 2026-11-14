import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Button, Input, Textarea, Select, useToast } from '../ui';
import { createTask } from '../../store/taskSlice';

export const CreateTaskModal = ({
  isOpen,
  onClose,
  initialColumn = 'TODO',
  workspaceId,
}) => {
  const dispatch = useDispatch();
  const toast = useToast();
  const { projects } = useSelector((state) => state.project);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(initialColumn);
  const [priority, setPriority] = useState('MEDIUM');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialColumn) {
      setStatus(initialColumn);
    }
  }, [initialColumn]);

  useEffect(() => {
    if (projects && projects.length > 0 && !projectId) {
      setProjectId(projects[0]._id || projects[0].id);
    }
  }, [projects, projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Validation Error', 'Task title is required.');
      return;
    }

    if (!projectId && projects.length > 0) {
      setProjectId(projects[0]._id || projects[0].id);
    }

    const selectedProjectId = projectId || (projects.length > 0 ? (projects[0]._id || projects[0].id) : null);
    if (!selectedProjectId && workspaceId) {
      toast.error('Validation Error', 'Please select a project for this task.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (workspaceId && selectedProjectId) {
        await dispatch(
          createTask({
            workspaceId,
            projectId: selectedProjectId,
            data: {
              title: title.trim(),
              description: description.trim(),
              status,
              priority,
              dueDate: dueDate || undefined,
            },
          })
        ).unwrap();
        toast.success('Task Created', `Added "${title}" to ${status.replace('_', ' ')}.`);
      } else {
        // Fallback for mock demo
        toast.success('Task Created', `Added "${title}" to board.`);
      }
      // Reset form
      setTitle('');
      setDescription('');
      setDueDate('');
      onClose();
    } catch (err) {
      toast.error('Failed to create task', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const projectOptions = projects && projects.length > 0
    ? projects.map((p) => ({ label: p.name, value: p._id || p.id }))
    : [{ label: 'Default Project', value: 'default' }];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      description={`Add a new task card directly to ${status.replace('_', ' ')}.`}
      footer={
        <div className="flex justify-end gap-2.5">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            Create Task
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="kanban-new-title"
          label="Task Title"
          placeholder="e.g. Implement drag-and-drop state machine"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        <Textarea
          id="kanban-new-desc"
          label="Description (Optional)"
          placeholder="Provide context, acceptance criteria or links..."
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-charcoal block mb-1.5">
              Project
            </label>
            <Select
              id="kanban-new-proj"
              options={projectOptions}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-charcoal block mb-1.5">
              Column Status
            </label>
            <Select
              id="kanban-new-col"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { label: 'Backlog', value: 'BACKLOG' },
                { label: 'To Do', value: 'TODO' },
                { label: 'In Progress', value: 'IN_PROGRESS' },
                { label: 'In Review', value: 'IN_REVIEW' },
                { label: 'Done', value: 'DONE' },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-charcoal block mb-1.5">
              Priority
            </label>
            <Select
              id="kanban-new-pri"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={[
                { label: 'Low', value: 'LOW' },
                { label: 'Medium', value: 'MEDIUM' },
                { label: 'High', value: 'HIGH' },
                { label: 'Critical', value: 'CRITICAL' },
              ]}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-charcoal block mb-1.5">
              Due Date
            </label>
            <Input
              id="kanban-new-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTaskModal;
