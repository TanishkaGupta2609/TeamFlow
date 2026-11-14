import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Radio, 
  RefreshCw,
  FolderKanban,
  CheckCircle2
} from 'lucide-react';
import { 
  Button, 
  Select, 
  Input, 
  SearchInput, 
  Avatar, 
  AvatarGroup, 
  useToast 
} from '../components/ui';
import { KanbanColumn } from '../components/kanban/KanbanColumn';
import { KanbanCard } from '../components/kanban/KanbanCard';
import { TaskDetailsModal } from '../components/kanban/TaskDetailsModal';
import { CreateTaskModal } from '../components/kanban/CreateTaskModal';
import { 
  fetchTasks, 
  moveTask, 
  moveTaskOptimistic,
  applyRealtimeTaskCreated,
  applyRealtimeTaskUpdated,
  applyRealtimeTaskMoved,
  applyRealtimeTaskDeleted,
  applyRealtimeCommentCreated
} from '../store/taskSlice';
import { fetchProjects } from '../store/projectSlice';
import { fetchMembers } from '../store/workspaceSlice';
import { 
  getSocket, 
  joinWorkspaceRoom, 
  leaveWorkspaceRoom 
} from '../services/socket';

const COLUMNS = [
  { id: 'BACKLOG', title: 'Backlog', color: 'border-slate-400' },
  { id: 'TODO', title: 'To Do', color: 'border-sage-dark' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-forest' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'border-amber-accent' },
  { id: 'DONE', title: 'Done', color: 'border-status-success' },
];

const COLUMN_ORDER = COLUMNS.map((c) => c.id);

export const KanbanPage = () => {
  const dispatch = useDispatch();
  const toast = useToast();

  const { tasks, isLoading } = useSelector((state) => state.task);
  const { currentWorkspace, members } = useSelector((state) => state.workspace);
  const { projects } = useSelector((state) => state.project);

  // Filters state
  const [selectedProject, setSelectedProject] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedAssignee, setSelectedAssignee] = useState('all');

  // Drag and Drop state
  const [activeTask, setActiveTask] = useState(null);

  // Modals state
  const [selectedTaskForModal, setSelectedTaskForModal] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalColumn, setCreateModalColumn] = useState('TODO');

  // Real-Time Online Presence state
  const [onlineMembers, setOnlineMembers] = useState([]);

  const workspaceId = currentWorkspace?._id;

  // Initialize sensors for @dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px threshold so clicks open task modal without starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch initial tasks, projects, members
  useEffect(() => {
    if (workspaceId) {
      dispatch(fetchTasks({ workspaceId }));
      dispatch(fetchProjects({ workspaceId }));
      dispatch(fetchMembers(workspaceId));
    }
  }, [dispatch, workspaceId]);

  // Socket.IO Real-Time collaboration integration
  useEffect(() => {
    if (!workspaceId) return;

    // Join room and get online members
    joinWorkspaceRoom(workspaceId, (membersList) => {
      setOnlineMembers(membersList || []);
    });

    const socket = getSocket();
    if (!socket) return;

    const handleTaskCreated = (data) => {
      dispatch(applyRealtimeTaskCreated(data));
      toast.info('New Task Added', `A new task was created in the board.`);
    };

    const handleTaskUpdated = (data) => {
      dispatch(applyRealtimeTaskUpdated(data));
    };

    const handleTaskMoved = (data) => {
      dispatch(applyRealtimeTaskMoved(data));
    };

    const handleTaskDeleted = (data) => {
      dispatch(applyRealtimeTaskDeleted(data));
      toast.info('Task Removed', 'A task was deleted from this board.');
    };

    const handleCommentCreated = (data) => {
      dispatch(applyRealtimeCommentCreated(data));
    };

    const handleMemberOnline = (data) => {
      if (data.userId) {
        setOnlineMembers((prev) => {
          if (prev.includes(data.userId)) return prev;
          return [...prev, data.userId];
        });
      }
    };

    const handleMemberOffline = (data) => {
      if (data.userId) {
        setOnlineMembers((prev) => prev.filter((id) => id !== data.userId));
      }
    };

    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:moved', handleTaskMoved);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('comment:created', handleCommentCreated);
    socket.on('member:online', handleMemberOnline);
    socket.on('member:offline', handleMemberOffline);

    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:moved', handleTaskMoved);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('comment:created', handleCommentCreated);
      socket.off('member:online', handleMemberOnline);
      socket.off('member:offline', handleMemberOffline);
      leaveWorkspaceRoom(workspaceId);
    };
  }, [dispatch, workspaceId, toast]);

  // Helper to normalize task status to one of the 5 columns
  const getTaskColumn = useCallback((task) => {
    const raw = task.status || task.column || 'TODO';
    const s = String(raw).toUpperCase();
    if (s === 'REVIEW') return 'IN_REVIEW';
    return s;
  }, []);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Project filter
      if (selectedProject !== 'all') {
        const pId = task.project?._id || task.project || task.projectId;
        if (pId !== selectedProject) return false;
      }

      // Priority filter
      if (selectedPriority !== 'all') {
        if (task.priority?.toUpperCase() !== selectedPriority.toUpperCase()) return false;
      }

      // Assignee filter
      if (selectedAssignee !== 'all') {
        const hasAssignee = task.assignees?.some(
          (a) => (a._id || a.id || a) === selectedAssignee
        ) || (task.assignee && (task.assignee._id || task.assignee.id || task.assignee) === selectedAssignee);
        if (!hasAssignee) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [tasks, selectedProject, selectedPriority, selectedAssignee, searchQuery]);

  // Group filtered tasks by column
  const tasksByColumn = useMemo(() => {
    const grouped = {
      BACKLOG: [],
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      DONE: [],
    };

    filteredTasks.forEach((task) => {
      const col = getTaskColumn(task);
      if (grouped[col]) {
        grouped[col].push(task);
      } else {
        grouped.TODO.push(task);
      }
    });

    // Sort tasks in each column by position
    Object.keys(grouped).forEach((col) => {
      grouped[col].sort((a, b) => (a.position || 0) - (b.position || 0));
    });

    return grouped;
  }, [filteredTasks, getTaskColumn]);

  // Drag Handlers
  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find((t) => (t._id || t.id) === active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeItem = tasks.find((t) => (t._id || t.id) === activeId);
    if (!activeItem) return;

    const activeCol = getTaskColumn(activeItem);

    // Determine if overId is a column or a task
    let overCol = COLUMN_ORDER.includes(overId) ? overId : null;
    if (!overCol) {
      const overItem = tasks.find((t) => (t._id || t.id) === overId);
      if (overItem) {
        overCol = getTaskColumn(overItem);
      }
    }

    if (overCol && activeCol !== overCol) {
      // Optimistically move between columns during drag over
      dispatch(moveTaskOptimistic({ taskId: activeId, status: overCol }));
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const draggedTask = tasks.find((t) => (t._id || t.id) === activeId);
    if (!draggedTask) return;

    // Identify target column
    let targetCol = COLUMN_ORDER.includes(overId) ? overId : null;
    let overTask = null;

    if (!targetCol) {
      overTask = tasks.find((t) => (t._id || t.id) === overId);
      if (overTask) {
        targetCol = getTaskColumn(overTask);
      }
    }

    if (!targetCol) return;

    // Calculate position relative to surrounding cards in target column
    const columnTasks = tasks
      .filter((t) => (t._id || t.id) !== activeId && getTaskColumn(t) === targetCol)
      .sort((a, b) => (a.position || 0) - (b.position || 0));

    let previousTaskId = null;
    let nextTaskId = null;
    let newPosition = 1000;

    if (overTask && (overTask._id || overTask.id) !== activeId) {
      const overIndex = columnTasks.findIndex((t) => (t._id || t.id) === (overTask._id || overTask.id));
      if (overIndex !== -1) {
        const prev = columnTasks[overIndex - 1];
        const next = columnTasks[overIndex];
        previousTaskId = prev ? (prev._id || prev.id) : null;
        nextTaskId = next ? (next._id || next.id) : null;

        const p1 = prev?.position || 0;
        const p2 = next?.position || (p1 + 2000);
        newPosition = (p1 + p2) / 2;
      }
    } else if (columnTasks.length > 0) {
      const last = columnTasks[columnTasks.length - 1];
      previousTaskId = last._id || last.id;
      newPosition = (last.position || 0) + 1000;
    }

    // Optimistically update
    dispatch(moveTaskOptimistic({ taskId: activeId, status: targetCol, position: newPosition }));

    if (workspaceId) {
      try {
        await dispatch(
          moveTask({
            workspaceId,
            taskId: activeId,
            status: targetCol,
            position: newPosition,
            previousTaskId,
            nextTaskId,
          })
        ).unwrap();
      } catch (err) {
        toast.error('Move failed', err || 'Could not move task');
        // Re-fetch to sync
        dispatch(fetchTasks({ workspaceId }));
      }
    }
  };

  // Keyboard / Click accessible move action
  const handleMoveTask = async (taskId, targetCol) => {
    if (!targetCol) return;
    dispatch(moveTaskOptimistic({ taskId, status: targetCol }));

    if (workspaceId) {
      try {
        await dispatch(
          moveTask({
            workspaceId,
            taskId,
            status: targetCol,
          })
        ).unwrap();
        toast.success('Task Moved', `Moved to ${targetCol.replace('_', ' ')}`);
      } catch (err) {
        toast.error('Move failed', err);
        dispatch(fetchTasks({ workspaceId }));
      }
    }
  };

  const handleOpenCreateModal = (columnId = 'TODO') => {
    setCreateModalColumn(columnId);
    setIsCreateModalOpen(true);
  };

  const projectOptions = [
    { label: 'All Projects', value: 'all' },
    ...(projects || []).map((p) => ({ label: p.name, value: p._id || p.id })),
  ];

  const assigneeOptions = [
    { label: 'All Assignees', value: 'all' },
    ...(members || []).map((m) => ({
      label: m.user?.name || m.name || 'Member',
      value: m.user?._id || m.user || m.id,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Kanban Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-heading font-extrabold text-charcoal">
              Kanban Board
            </h1>
            {/* Real-Time Sync Indicator */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-status-success border border-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-status-success"></span>
              </span>
              Live Sync
            </span>
          </div>
          <p className="text-xs text-charcoal-secondary mt-1">
            Visual workflow and real-time status progression across all sprint tasks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Online Presence Indicator */}
          {onlineMembers.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-border text-xs text-charcoal-secondary">
              <span className="w-2 h-2 rounded-full bg-status-success"></span>
              <span className="font-medium text-charcoal">{onlineMembers.length} active</span>
            </div>
          )}

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => handleOpenCreateModal('TODO')}
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-3.5 bg-white rounded-xl border border-border shadow-subtle flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchInput
            id="kanban-search"
            placeholder="Filter tasks by title or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Project Filter */}
          <div className="w-44">
            <Select
              id="kanban-filter-proj"
              options={projectOptions}
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            />
          </div>

          {/* Priority Filter */}
          <div className="w-36">
            <Select
              id="kanban-filter-pri"
              options={[
                { label: 'All Priorities', value: 'all' },
                { label: 'Low', value: 'LOW' },
                { label: 'Medium', value: 'MEDIUM' },
                { label: 'High', value: 'HIGH' },
                { label: 'Critical', value: 'CRITICAL' },
              ]}
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
            />
          </div>

          {/* Assignee Filter */}
          {assigneeOptions.length > 1 && (
            <div className="w-40">
              <Select
                id="kanban-filter-assignee"
                options={assigneeOptions}
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Kanban Drag-and-Drop Columns Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start pb-6">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={tasksByColumn[col.id] || []}
              onAddTask={() => handleOpenCreateModal(col.id)}
              onCardClick={(task) => setSelectedTaskForModal(task)}
              onMoveTask={handleMoveTask}
              columnOrder={COLUMN_ORDER}
            />
          ))}
        </div>

        {/* Drag Overlay: Renders card while dragging */}
        <DragOverlay>
          {activeTask ? (
            <div className="transform rotate-2 scale-105 shadow-2xl opacity-90 cursor-grabbing pointer-events-none">
              <KanbanCard
                task={activeTask}
                columnId={getTaskColumn(activeTask)}
                isLeftDisabled={true}
                isRightDisabled={true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Details Modal (Subtasks, Comments, History) */}
      <TaskDetailsModal
        isOpen={!!selectedTaskForModal}
        onClose={() => setSelectedTaskForModal(null)}
        task={selectedTaskForModal}
        workspaceId={workspaceId}
      />

      {/* Quick Add Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialColumn={createModalColumn}
        workspaceId={workspaceId}
      />
    </div>
  );
};

export default KanbanPage;
