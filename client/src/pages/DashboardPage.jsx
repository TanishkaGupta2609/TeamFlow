import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Plus, 
  Calendar as CalendarIcon, 
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  mockCurrentUser, 
  mockWorkspaces, 
  mockProjects, 
  mockTasks, 
  mockActivities, 
  mockAnalytics 
} from '../services/mockData';
import { 
  Button, 
  StatusBadge, 
  PriorityBadge, 
  Avatar, 
  ProgressBar, 
  Checkbox, 
  useToast 
} from '../components/ui';

export const DashboardPage = () => {
  const toast = useToast();
  const [tasks, setTasks] = useState(mockTasks);

  const toggleTaskCompletion = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
    toast.success('Task Updated', 'Task completion status updated.');
  };

  const myTasks = tasks.filter((t) => t.assignedToMe);
  const totalProjects = mockProjects.length;
  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const pendingTasksCount = tasks.filter((t) => !t.completed).length;
  const overdueTasksCount = tasks.filter((t) => !t.completed && new Date(t.dueDate) < new Date()).length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <section className="bg-white rounded-xl border border-border p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-dark uppercase tracking-wider">
              {mockWorkspaces[0].name}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-forest"></span>
            <span className="text-xs text-charcoal-secondary">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-charcoal mt-1 tracking-tight">
            Welcome back, {mockCurrentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-secondary mt-1 max-w-xl">
            Here is a snapshot of your workspace velocity, active deadlines, and team activities.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/projects">
            <Button variant="outline" size="sm">
              All Projects
            </Button>
          </Link>
          <Link to="/kanban">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Open Board
            </Button>
          </Link>
        </div>
      </section>

      {/* 4 Core Metrics Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-border shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-charcoal-secondary uppercase tracking-wider">Total Projects</span>
            <h3 className="text-2xl font-heading font-extrabold text-charcoal mt-1">{totalProjects}</h3>
            <span className="text-[11px] text-status-success font-medium">5 active in workspace</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-forest/10 text-forest flex items-center justify-center">
            <FolderKanban className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-border shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-charcoal-secondary uppercase tracking-wider">Completed Tasks</span>
            <h3 className="text-2xl font-heading font-extrabold text-status-success mt-1">{completedTasksCount}</h3>
            <span className="text-[11px] text-charcoal-secondary">Across all sprints</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-status-success flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-border shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-charcoal-secondary uppercase tracking-wider">Pending Tasks</span>
            <h3 className="text-2xl font-heading font-extrabold text-charcoal mt-1">{pendingTasksCount}</h3>
            <span className="text-[11px] text-amber-dark font-medium">{myTasks.filter(t => !t.completed).length} assigned to you</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-light text-amber-accent flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-border shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-charcoal-secondary uppercase tracking-wider">Overdue Tasks</span>
            <h3 className="text-2xl font-heading font-extrabold text-status-danger mt-1">{overdueTasksCount}</h3>
            <span className="text-[11px] text-status-danger font-medium">Requires immediate action</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-status-danger flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* Middle Row: Velocity Chart & Assigned Tasks */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Velocity Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h2 className="font-heading font-bold text-base text-charcoal">Weekly Task Velocity</h2>
              <p className="text-xs text-charcoal-secondary">Completed vs created tasks this sprint</p>
            </div>
            <span className="text-xs font-semibold text-forest flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              +18% Velocity
            </span>
          </div>

          <div className="h-64 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockAnalytics.weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#173F35" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#173F35" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D49A52" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D49A52" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9E7E0" vertical={false} />
                <XAxis dataKey="day" stroke="#747B73" fontSize={11} tickLine={false} />
                <YAxis stroke="#747B73" fontSize={11} tickLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E9E7E0', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="completed" name="Completed" stroke="#173F35" strokeWidth={2} fillOpacity={1} fill="url(#completedGrad)" />
                <Area type="monotone" dataKey="created" name="Created" stroke="#D49A52" strokeWidth={2} fillOpacity={1} fill="url(#createdGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* My Assigned Tasks List */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="font-heading font-bold text-base text-charcoal">My Tasks</h2>
              <Link to="/tasks" className="text-xs font-semibold text-forest hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-border mt-3">
              {myTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="py-2.5 flex items-start gap-2.5">
                  <div className="mt-0.5">
                    <Checkbox
                      id={`chk-${task.id}`}
                      checked={task.completed}
                      onChange={() => toggleTaskCompletion(task.id)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium leading-snug truncate ${task.completed ? 'line-through text-charcoal-secondary' : 'text-charcoal'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-charcoal-secondary font-mono">{task.dueDate}</span>
                      <PriorityBadge priority={task.priority} size="sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link to="/tasks" className="mt-4 pt-3 border-t border-border block">
            <Button variant="outline" size="sm" className="w-full text-xs">
              Go to Task Center
            </Button>
          </Link>
        </div>
      </section>

      {/* Bottom Row: Recent Projects & Activity Stream */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-6 shadow-card">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h2 className="font-heading font-bold text-base text-charcoal">Active Projects</h2>
              <p className="text-xs text-charcoal-secondary">Track deadlines, progress, and managers</p>
            </div>
            <Link to="/projects">
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View All Projects
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-border mt-4">
            {mockProjects.slice(0, 3).map((project) => (
              <div key={project.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-forest/5 text-forest">
                      {project.key}
                    </span>
                    <h4 className="font-heading font-bold text-sm text-charcoal">{project.name}</h4>
                  </div>
                  <p className="text-xs text-charcoal-secondary line-clamp-1">{project.description}</p>
                </div>

                <div className="flex items-center gap-6 sm:w-64">
                  <div className="flex-1">
                    <ProgressBar value={project.progress} size="sm" />
                  </div>
                  <StatusBadge status={project.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="bg-white rounded-xl border border-border p-6 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="font-heading font-bold text-base text-charcoal flex items-center gap-2">
              <Activity className="w-4 h-4 text-forest" />
              Activity Feed
            </h2>
            <span className="text-[11px] text-charcoal-secondary">Real-time</span>
          </div>

          <div className="space-y-4 mt-4">
            {mockActivities.slice(0, 4).map((act) => (
              <div key={act.id} className="flex items-start gap-3 text-xs">
                <Avatar name={act.user.name} size="xs" status={act.user.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-charcoal leading-snug">
                    <strong className="font-semibold">{act.user.name}</strong> {act.action}{' '}
                    <span className="font-medium text-forest truncate block sm:inline">{act.target}</span>
                  </p>
                  <span className="text-[10px] text-charcoal-secondary mt-0.5 block">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
