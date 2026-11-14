import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { KanbanCard } from './KanbanCard';

export const KanbanColumn = ({
  column,
  tasks = [],
  onAddTask,
  onCardClick,
  onMoveTask,
  columnOrder = [],
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      columnId: column.id,
    },
  });

  const taskIds = tasks.map((t) => t._id || t.id);
  const columnIndex = columnOrder.indexOf(column.id);

  return (
    <div
      ref={setNodeRef}
      className={`bg-white rounded-xl border border-border shadow-card flex flex-col min-h-[550px] max-h-[calc(100vh-14rem)] overflow-hidden border-t-4 transition-all duration-150 ${
        column.color
      } ${isOver ? 'ring-2 ring-forest/40 bg-ivory/30' : ''}`}
    >
      {/* Column Header */}
      <div className="p-3.5 border-b border-border flex items-center justify-between bg-ivory/30 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-heading font-bold text-xs text-charcoal uppercase tracking-wider">
            {column.title}
          </h3>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-border text-charcoal">
            {tasks.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onAddTask && onAddTask(column.id)}
          className="p-1 rounded text-charcoal-secondary hover:text-charcoal hover:bg-white transition-colors"
          aria-label={`Add task to ${column.title}`}
          title={`Add task to ${column.title}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Droppable and Sortable Task List */}
      <div className="p-3 space-y-3 overflow-y-auto flex-1 flex flex-col">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard
              key={task._id || task.id}
              task={task}
              columnId={column.id}
              onClick={onCardClick}
              onMoveLeft={() => onMoveTask && onMoveTask(task._id || task.id, columnOrder[columnIndex - 1])}
              onMoveRight={() => onMoveTask && onMoveTask(task._id || task.id, columnOrder[columnIndex + 1])}
              isLeftDisabled={columnIndex === 0}
              isRightDisabled={columnIndex === columnOrder.length - 1}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-10 border border-dashed border-border rounded-lg text-center p-4">
            <p className="text-xs text-charcoal-secondary/70 font-medium">
              No tasks in {column.title}
            </p>
            <p className="text-[11px] text-charcoal-secondary/50 mt-1">
              Drag cards here or click + to add
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
