import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  FolderKanban, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { mockTasks, mockProjects } from '../services/mockData';
import { 
  Button, 
  PriorityBadge, 
  Modal, 
  Avatar, 
  useToast 
} from '../components/ui';

export const CalendarPage = () => {
  const toast = useToast();
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'
  const [selectedEvent, setSelectedEvent] = useState(null);

  // November 2026 baseline
  const currentMonthName = 'November 2026';
  const daysInMonth = 30;
  const startDayOffset = 0; // Nov 1, 2026 was Sunday (0)

  // Map tasks into day buckets
  const eventsByDay = {};
  mockTasks.forEach((task) => {
    // dueDate is "2026-11-XX"
    const parts = task.dueDate.split('-');
    if (parts[1] === '11') {
      const dayNum = parseInt(parts[2], 10);
      if (!eventsByDay[dayNum]) eventsByDay[dayNum] = [];
      eventsByDay[dayNum].push({ type: 'task', data: task });
    }
  });

  // Map project deadlines
  mockProjects.forEach((proj) => {
    const parts = proj.deadline.split('-');
    if (parts[1] === '11') {
      const dayNum = parseInt(parts[2], 10);
      if (!eventsByDay[dayNum]) eventsByDay[dayNum] = [];
      eventsByDay[dayNum].push({ type: 'project', data: proj });
    }
  });

  const calendarDays = [];
  for (let i = 0; i < startDayOffset; i++) {
    calendarDays.push({ day: null });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({ day, events: eventsByDay[day] || [] });
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-charcoal">Delivery Calendar</h1>
          <p className="text-xs text-charcoal-secondary mt-1">
            Track milestones, sprint releases, and project deadlines across your calendar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month / Week Switcher */}
          <div className="flex items-center border border-border rounded-btn p-0.5 bg-ivory text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === 'month' ? 'bg-white shadow-subtle text-forest' : 'text-charcoal-secondary'
              }`}
            >
              Month View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === 'week' ? 'bg-white shadow-subtle text-forest' : 'text-charcoal-secondary'
              }`}
            >
              Week View
            </button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center gap-1 border border-border rounded-btn p-1 bg-white">
            <button
              type="button"
              onClick={() => toast.info('Previous Month', 'Showing previous schedule.')}
              className="p-1 rounded text-charcoal-secondary hover:text-charcoal hover:bg-ivory"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-charcoal px-2 select-none">
              {currentMonthName}
            </span>
            <button
              type="button"
              onClick={() => toast.info('Next Month', 'Showing next schedule.')}
              className="p-1 rounded text-charcoal-secondary hover:text-charcoal hover:bg-ivory"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-border bg-ivory text-center text-xs font-bold text-charcoal-secondary py-2.5">
          {weekDays.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border min-h-[540px]">
          {calendarDays.map((cell, idx) => {
            const isToday = cell.day === 14;

            if (!cell.day) {
              return <div key={`empty-${idx}`} className="bg-ivory/30 min-h-[90px]" />;
            }

            return (
              <div
                key={`day-${cell.day}`}
                className={`p-2 min-h-[100px] flex flex-col justify-between transition-colors hover:bg-ivory/40 ${
                  isToday ? 'bg-forest/5' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-forest text-white shadow-subtle'
                        : 'text-charcoal'
                    }`}
                  >
                    {cell.day}
                  </span>
                  {cell.events.length > 0 && (
                    <span className="text-[10px] font-bold text-charcoal-secondary">
                      {cell.events.length}
                    </span>
                  )}
                </div>

                {/* Deadlines Pills */}
                <div className="space-y-1 mt-1 overflow-y-auto max-h-20">
                  {cell.events.map((evt, eIdx) => {
                    const isProj = evt.type === 'project';
                    return (
                      <button
                        key={eIdx}
                        type="button"
                        onClick={() => setSelectedEvent(evt)}
                        className={`w-full text-left p-1 rounded text-[10px] font-medium leading-tight truncate block transition-transform hover:scale-[1.02] ${
                          isProj
                            ? 'bg-amber-light text-amber-dark border border-amber-accent/30'
                            : 'bg-forest/10 text-forest border border-forest/20'
                        }`}
                      >
                        {isProj ? '🚀 Proj: ' : '📋 '}
                        {evt.data.name || evt.data.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Details Modal */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.type === 'project' ? 'Project Deadline' : 'Task Details'}
        footer={
          <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>
            Close
          </Button>
        }
      >
        {selectedEvent && (
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-[10px] font-bold text-charcoal-secondary uppercase tracking-wider">
                {selectedEvent.type.toUpperCase()}
              </span>
              <h3 className="font-heading font-bold text-base text-charcoal mt-1">
                {selectedEvent.data.name || selectedEvent.data.title}
              </h3>
            </div>

            {selectedEvent.data.description && (
              <p className="text-charcoal-secondary leading-relaxed">
                {selectedEvent.data.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 p-3 bg-ivory rounded-lg border border-border">
              <div>
                <span className="text-charcoal-secondary block font-semibold">Deadline / Target:</span>
                <span className="font-mono text-charcoal font-bold mt-0.5 block">
                  {selectedEvent.data.deadline || selectedEvent.data.dueDate}
                </span>
              </div>
              <div>
                <span className="text-charcoal-secondary block font-semibold">Priority:</span>
                <div className="mt-0.5">
                  <PriorityBadge priority={selectedEvent.data.priority} size="sm" />
                </div>
              </div>
            </div>

            {selectedEvent.data.assignee && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-charcoal-secondary font-semibold">Assignee:</span>
                <div className="flex items-center gap-2">
                  <Avatar name={selectedEvent.data.assignee.name} size="xs" />
                  <span className="font-medium text-charcoal">{selectedEvent.data.assignee.name}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CalendarPage;
