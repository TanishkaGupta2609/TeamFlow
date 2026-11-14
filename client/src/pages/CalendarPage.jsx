import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  FolderKanban, 
  CheckCircle2, 
  AlertCircle,
  Filter,
  CheckSquare
} from 'lucide-react';
import api from '../services/api';
import { mockTasks, mockProjects } from '../services/mockData';
import { 
  Button, 
  PriorityBadge, 
  Avatar, 
  Select, 
  useToast 
} from '../components/ui';
import { TaskDetailsModal } from '../components/kanban/TaskDetailsModal';

export const CalendarPage = () => {
  const toast = useToast();
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const { projects: storeProjects } = useSelector((state) => state.project);
  const workspaceId = currentWorkspace?._id;

  const [currentDate, setCurrentDate] = useState(new Date(2026, 10, 14)); // Nov 14, 2026
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day'
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState(null);

  // Fetch real calendar events from backend API
  useEffect(() => {
    let isMounted = true;
    const loadCalendarEvents = async () => {
      if (!workspaceId) {
        setTasks(mockTasks);
        setProjects(mockProjects);
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.get(`/workspaces/${workspaceId}/calendar`, {
          params: {
            projectId: selectedProject !== 'all' ? selectedProject : undefined,
            priority: selectedPriority !== 'all' ? selectedPriority : undefined,
          },
        });
        if (isMounted && response.data?.data) {
          setTasks(response.data.data.tasks || []);
          setProjects(response.data.data.projects || []);
        }
      } catch (err) {
        if (isMounted) {
          setTasks(mockTasks);
          setProjects(mockProjects);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCalendarEvents();
    return () => { isMounted = false; };
  }, [workspaceId, selectedProject, selectedPriority]);

  // Date Navigation
  const navigatePrevious = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const navigateNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const navigateToday = () => {
    setCurrentDate(new Date(2026, 10, 14));
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Map events by Date String ("YYYY-MM-DD")
  const eventsByDate = useMemo(() => {
    const map = {};

    tasks.forEach((t) => {
      if (!t.dueDate) return;
      const dateKey = new Date(t.dueDate).toISOString().slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push({ type: 'task', item: t });
    });

    projects.forEach((p) => {
      if (!p.endDate && !p.deadline) return;
      const d = p.endDate || p.deadline;
      const dateKey = new Date(d).toISOString().slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push({ type: 'project', item: p });
    });

    return map;
  }, [tasks, projects]);

  // Generate Month Matrix
  const monthDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, dateKey: null });
    }
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateKey = `${currentYear}-${monthStr}-${dayStr}`;
      days.push({
        dayNumber: d,
        dateKey,
        events: eventsByDate[dateKey] || [],
      });
    }
    return days;
  }, [currentYear, currentMonth, eventsByDate]);

  // Generate Week Days
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateKey = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        dayNumber: d.getDate(),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateKey,
        events: eventsByDate[dateKey] || [],
      });
    }
    return days;
  }, [currentDate, eventsByDate]);

  const weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const projectOptions = [
    { label: 'All Projects', value: 'all' },
    ...((storeProjects && storeProjects.length > 0 ? storeProjects : mockProjects).map((p) => ({
      label: p.name,
      value: p._id || p.id,
    }))),
  ];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-charcoal">Delivery Calendar</h1>
          <p className="text-xs text-charcoal-secondary mt-1">
            Track milestones, sprint releases, and project deadlines across your calendar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Switcher */}
          <div className="flex items-center border border-border rounded-btn p-0.5 bg-ivory text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === 'month' ? 'bg-white shadow-subtle text-forest' : 'text-charcoal-secondary hover:text-charcoal'
              }`}
            >
              Month View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === 'week' ? 'bg-white shadow-subtle text-forest' : 'text-charcoal-secondary hover:text-charcoal'
              }`}
            >
              Week View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === 'day' ? 'bg-white shadow-subtle text-forest' : 'text-charcoal-secondary hover:text-charcoal'
              }`}
            >
              Day View
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1 border border-border rounded-btn p-1 bg-white shadow-subtle">
            <button
              type="button"
              onClick={navigatePrevious}
              className="p-1 rounded text-charcoal-secondary hover:text-charcoal hover:bg-ivory"
              aria-label="Previous period"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={navigateToday}
              className="text-xs font-bold text-forest px-2 hover:underline"
            >
              Today
            </button>
            <span className="text-xs font-bold text-charcoal px-2 select-none border-l border-r border-border">
              {monthName}
            </span>
            <button
              type="button"
              onClick={navigateNext}
              className="p-1 rounded text-charcoal-secondary hover:text-charcoal hover:bg-ivory"
              aria-label="Next period"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 bg-white rounded-xl border border-border shadow-subtle flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-charcoal">
          <Filter className="w-4 h-4 text-forest" />
          <span>Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-48">
            <Select
              id="cal-filter-proj"
              options={projectOptions}
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            />
          </div>

          <div className="w-36">
            <Select
              id="cal-filter-pri"
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
        </div>
      </div>

      {/* View Mode: Month Grid */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-border bg-ivory text-center text-xs font-bold text-charcoal-secondary py-2.5">
            {weekDayNames.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Days Matrix */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border min-h-[580px]">
            {monthDays.map((cell, idx) => {
              if (!cell.dayNumber) {
                return <div key={`empty-${idx}`} className="bg-ivory/30 min-h-[100px]" />;
              }

              const isToday = cell.dayNumber === 14 && currentMonth === 10 && currentYear === 2026;

              return (
                <div
                  key={`day-${cell.dayNumber}`}
                  className={`p-2 min-h-[110px] flex flex-col justify-between transition-colors hover:bg-ivory/40 ${
                    isToday ? 'bg-forest/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-forest text-white shadow-subtle'
                          : 'text-charcoal'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {cell.events.length > 0 && (
                      <span className="text-[10px] font-mono text-charcoal-secondary">
                        {cell.events.length} {cell.events.length === 1 ? 'item' : 'items'}
                      </span>
                    )}
                  </div>

                  {/* Day Events */}
                  <div className="space-y-1.5 flex-1 overflow-y-auto max-h-24">
                    {cell.events.map((ev, evIdx) => {
                      if (ev.type === 'task') {
                        const task = ev.item;
                        return (
                          <div
                            key={`task-${task._id || task.id || evIdx}`}
                            onClick={() => setSelectedTaskForModal(task)}
                            className="p-1.5 bg-white rounded border border-border hover:border-forest/60 shadow-subtle text-[11px] font-medium text-charcoal truncate flex items-center gap-1.5 cursor-pointer group"
                            title={task.title}
                          >
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                task.priority === 'CRITICAL'
                                  ? 'bg-status-danger'
                                  : task.priority === 'HIGH'
                                  ? 'bg-amber-accent'
                                  : 'bg-forest'
                              }`}
                            />
                            <span className="truncate flex-1">{task.title}</span>
                          </div>
                        );
                      } else {
                        const project = ev.item;
                        return (
                          <div
                            key={`proj-${project._id || project.id || evIdx}`}
                            className="p-1.5 bg-forest/10 rounded border border-forest/20 text-[10px] font-bold text-forest truncate flex items-center gap-1"
                            title={`Project Milestone: ${project.name}`}
                          >
                            <FolderKanban className="w-3 h-3 text-forest shrink-0" />
                            <span className="truncate">{project.name}</span>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View Mode: Week View */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="grid grid-cols-7 divide-x divide-border min-h-[580px]">
            {weekDays.map((col) => {
              const isToday = col.dayNumber === 14 && col.date.getMonth() === 10;
              return (
                <div key={col.dateKey} className="flex flex-col min-h-[580px]">
                  {/* Column Header */}
                  <div className={`p-3 border-b border-border text-center ${isToday ? 'bg-forest/10' : 'bg-ivory/50'}`}>
                    <span className="text-[11px] font-bold text-charcoal-secondary uppercase block">
                      {col.dayName}
                    </span>
                    <span className={`text-sm font-extrabold inline-block mt-0.5 ${isToday ? 'text-forest' : 'text-charcoal'}`}>
                      {col.dayNumber}
                    </span>
                  </div>

                  {/* Column Task Cards */}
                  <div className="p-2 space-y-2 flex-1 overflow-y-auto bg-ivory/10">
                    {col.events.length === 0 ? (
                      <p className="text-[10px] text-charcoal-secondary/50 text-center py-8">
                        No events
                      </p>
                    ) : (
                      col.events.map((ev, idx) => {
                        if (ev.type === 'task') {
                          const task = ev.item;
                          return (
                            <div
                              key={task._id || task.id || idx}
                              onClick={() => setSelectedTaskForModal(task)}
                              className="p-2.5 bg-white rounded-lg border border-border hover:border-forest shadow-subtle space-y-1.5 cursor-pointer"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <PriorityBadge priority={task.priority?.toLowerCase() || 'medium'} size="sm" />
                                <span className="text-[10px] text-charcoal-secondary font-mono">
                                  {task.status}
                                </span>
                              </div>
                              <h5 className="font-heading font-semibold text-xs text-charcoal line-clamp-2">
                                {task.title}
                              </h5>
                            </div>
                          );
                        } else {
                          const proj = ev.item;
                          return (
                            <div
                              key={proj._id || proj.id || idx}
                              className="p-2.5 bg-forest/5 rounded-lg border border-forest/30 space-y-1"
                            >
                              <span className="text-[9px] font-bold text-forest uppercase tracking-wider block">
                                Project Milestone
                              </span>
                              <h5 className="font-heading font-bold text-xs text-charcoal truncate">
                                {proj.name}
                              </h5>
                            </div>
                          );
                        }
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View Mode: Day View */}
      {viewMode === 'day' && (
        <div className="p-6 bg-white rounded-xl border border-border shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="font-heading font-extrabold text-lg text-charcoal">
                {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <p className="text-xs text-charcoal-secondary">
                Scheduled deadlines and milestone targets for this day.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-forest/10 text-forest rounded-full">
              {(eventsByDate[currentDate.toISOString().slice(0, 10)] || []).length} Scheduled Items
            </span>
          </div>

          <div className="space-y-3">
            {(eventsByDate[currentDate.toISOString().slice(0, 10)] || []).length === 0 ? (
              <div className="py-12 text-center text-xs text-charcoal-secondary/60 border border-dashed border-border rounded-lg">
                No tasks or project deadlines scheduled on this day.
              </div>
            ) : (
              (eventsByDate[currentDate.toISOString().slice(0, 10)] || []).map((ev, idx) => {
                if (ev.type === 'task') {
                  const task = ev.item;
                  return (
                    <div
                      key={task._id || task.id || idx}
                      onClick={() => setSelectedTaskForModal(task)}
                      className="p-4 bg-white rounded-xl border border-border hover:border-forest shadow-subtle flex items-center justify-between cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={task.priority?.toLowerCase() || 'medium'} size="sm" />
                          <span className="text-xs font-bold text-charcoal">{task.title}</span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-charcoal-secondary line-clamp-1">{task.description}</p>
                        )}
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-ivory text-charcoal border border-border">
                        {task.status}
                      </span>
                    </div>
                  );
                } else {
                  const proj = ev.item;
                  return (
                    <div
                      key={proj._id || proj.id || idx}
                      className="p-4 bg-forest/5 rounded-xl border border-forest/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <FolderKanban className="w-5 h-5 text-forest" />
                        <div>
                          <h4 className="font-heading font-bold text-sm text-charcoal">{proj.name}</h4>
                          <span className="text-[11px] text-charcoal-secondary">Major Project Target Deadline</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-forest">Progress: {proj.progress || 0}%</span>
                    </div>
                  );
                }
              })
            )}
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTaskForModal && (
        <TaskDetailsModal
          isOpen={!!selectedTaskForModal}
          onClose={() => setSelectedTaskForModal(null)}
          task={selectedTaskForModal}
          workspaceId={workspaceId}
        />
      )}
    </div>
  );
};

export default CalendarPage;
