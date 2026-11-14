import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  MessageSquare, 
  Paperclip, 
  Calendar, 
  CheckSquare, 
  ChevronLeft, 
  ChevronRight,
  GripVertical
} from 'lucide-react';
import { PriorityBadge, Avatar } from '../ui';

export const KanbanCard = ({ 
  task, 
  columnId, 
  onClick, 
  onMoveLeft, 
  onMoveRight, 
  isLeftDisabled, 
  isRightDisabled 
}) => {
  const taskId = task._id || task.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: taskId,
    data: {
      type: 'Task',
      task,
      columnId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const completedSubtasks = task.subtasks?.filter((s) => s.completed)?.length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const dueDateFormatted = task.dueDate 
    ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative p-3.5 bg-white rounded-lg border border-border shadow-subtle hover:border-forest/50 hover:shadow-card transition-all duration-150 space-y-2.5 cursor-pointer ${
        isDragging ? 'ring-2 ring-forest' : ''
      }`}
      onClick={() => onClick && onClick(task)}
    >
      {/* Top Meta: Priority, Drag Handle, Due Date */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="text-charcoal-secondary/40 hover:text-charcoal cursor-grab active:cursor-grabbing p-0.5"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            aria-label="Drag handle"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
          <PriorityBadge priority={task.priority?.toLowerCase() || 'medium'} size="sm" />
        </div>

        {dueDateFormatted && (
          <span className="flex items-center gap-1 text-[10px] text-charcoal-secondary font-mono bg-ivory px-1.5 py-0.5 rounded border border-border">
            <Calendar className="w-2.5 h-2.5" />
            {dueDateFormatted}
          </span>
        )}
      </div>

      {/* Task Title & Project Tag */}
      <div>
        {task.project?.name && (
          <span className="text-[10px] font-semibold text-forest uppercase tracking-wider block mb-1">
            {task.project.name}
          </span>
        )}
        <h4 className="font-heading font-semibold text-xs text-charcoal leading-snug line-clamp-2">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-[11px] text-charcoal-secondary line-clamp-1 mt-1 font-body">
            {task.description}
          </p>
        )}
      </div>

      {/* Card Footer: Metrics & Assignee */}
      <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-charcoal-secondary">
        <div className="flex items-center gap-2.5 text-[11px]">
          {totalSubtasks > 0 && (
            <span 
              className={`flex items-center gap-1 ${
                completedSubtasks === totalSubtasks ? 'text-status-success font-medium' : 'text-charcoal-secondary'
              }`}
              title={`Subtasks: ${completedSubtasks}/${totalSubtasks}`}
            >
              <CheckSquare className="w-3 h-3" />
              {completedSubtasks}/{totalSubtasks}
            </span>
          )}

          {(task.commentCount > 0 || task.comments?.length > 0) && (
            <span className="flex items-center gap-1" title="Comments">
              <MessageSquare className="w-3 h-3" />
              {task.commentCount || task.comments?.length}
            </span>
          )}

          {(task.attachmentCount > 0 || task.attachments?.length > 0) && (
            <span className="flex items-center gap-1" title="Attachments">
              <Paperclip className="w-3 h-3" />
              {task.attachmentCount || task.attachments?.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Shift buttons for keyboard/click accessible moving */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity" onClick={(e) => e.stopPropagation()}>
            {!isLeftDisabled && (
              <button
                type="button"
                onClick={onMoveLeft}
                className="p-1 rounded text-charcoal-secondary hover:text-charcoal hover:bg-ivory"
                title="Move to previous column"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
            )}
            {!isRightDisabled && (
              <button
                type="button"
                onClick={onMoveRight}
                className="p-1 rounded text-charcoal-secondary hover:text-charcoal hover:bg-ivory"
                title="Move to next column"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Assignee Avatar */}
          {task.assignees && task.assignees.length > 0 ? (
            <Avatar
              name={task.assignees[0].name}
              src={task.assignees[0].avatar}
              size="xs"
            />
          ) : task.assignee ? (
            <Avatar
              name={task.assignee.name || task.assignee}
              size="xs"
              status={task.assignee.status}
            />
          ) : (
            <div className="w-5 h-5 rounded-full border border-dashed border-charcoal-secondary/40 flex items-center justify-center text-[9px] text-charcoal-secondary">
              -
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KanbanCard;
