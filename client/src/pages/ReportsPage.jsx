import React from 'react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  FolderKanban, 
  Download 
} from 'lucide-react';
import { mockAnalytics, mockProjects, mockTasks } from '../services/mockData';
import { 
  Button, 
  ProgressBar, 
  StatusBadge, 
  PriorityBadge, 
  useToast 
} from '../components/ui';

export const ReportsPage = () => {
  const toast = useToast();

  const overdueTasks = mockTasks.filter(
    (t) => !t.completed && new Date(t.dueDate) < new Date()
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-charcoal">Analytics &amp; Reports</h1>
          <p className="text-xs text-charcoal-secondary mt-1">
            Data-driven insights on team velocity, delivery completion, and bottleneck identification.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={() => toast.success('Report Exported', 'CSV summary downloaded to your device.')}
        >
          Export CSV Report
        </Button>
      </div>

      {/* Completion Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-border shadow-card">
          <span className="text-xs font-semibold text-charcoal-secondary uppercase tracking-wider">Completion Rate</span>
          <h3 className="text-3xl font-heading font-extrabold text-forest mt-1">
            {mockAnalytics.completionOverview.completionRate}%
          </h3>
          <p className="text-[11px] text-status-success font-medium mt-1">
            46 of 62 total tasks finished
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-border shadow-card">
          <span className="text-xs font-semibold text-charcoal-secondary uppercase tracking-wider">Active Sprints</span>
          <h3 className="text-3xl font-heading font-extrabold text-charcoal mt-1">5</h3>
          <p className="text-[11px] text-charcoal-secondary mt-1">3 on schedule, 2 under review</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-border shadow-card">
          <span className="text-xs font-semibold text-charcoal-secondary uppercase tracking-wider">Pending Delivery</span>
          <h3 className="text-3xl font-heading font-extrabold text-amber-accent mt-1">
            {mockAnalytics.completionOverview.pendingTasks}
          </h3>
          <p className="text-[11px] text-charcoal-secondary mt-1">Scheduled for this sprint</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-border shadow-card">
          <span className="text-xs font-semibold text-charcoal-secondary uppercase tracking-wider">Overdue Tasks</span>
          <h3 className="text-3xl font-heading font-extrabold text-status-danger mt-1">
            {overdueTasks.length}
          </h3>
          <p className="text-[11px] text-status-danger font-medium mt-1">Requires lead attention</p>
        </div>
      </div>

      {/* Charts Section: Distribution & Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Distribution Donut Chart */}
        <div className="p-6 bg-white rounded-xl border border-border shadow-card flex flex-col justify-between">
          <div>
            <h2 className="font-heading font-bold text-base text-charcoal">Task Status Distribution</h2>
            <p className="text-xs text-charcoal-secondary">Breakdown of all active and completed tasks</p>
          </div>

          <div className="h-64 my-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockAnalytics.distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {mockAnalytics.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E9E7E0', borderRadius: '8px', fontSize: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Performance Bar Chart */}
        <div className="p-6 bg-white rounded-xl border border-border shadow-card flex flex-col justify-between">
          <div>
            <h2 className="font-heading font-bold text-base text-charcoal">Team Velocity by Member</h2>
            <p className="text-xs text-charcoal-secondary">Tasks completed per collaborator</p>
          </div>

          <div className="h-64 my-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockAnalytics.velocityByMember} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9E7E0" vertical={false} />
                <XAxis dataKey="name" stroke="#747B73" fontSize={11} tickLine={false} />
                <YAxis stroke="#747B73" fontSize={11} tickLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E9E7E0', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="tasks" name="Tasks Delivered" fill="#173F35" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Project Progress Table */}
      <div className="p-6 bg-white rounded-xl border border-border shadow-card">
        <h2 className="font-heading font-bold text-base text-charcoal mb-4">
          Project Progress Summary
        </h2>
        <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
          {mockProjects.map((p) => (
            <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-ivory/50">
              <div className="max-w-md">
                <h4 className="font-heading font-bold text-xs text-charcoal">{p.name}</h4>
                <p className="text-[11px] text-charcoal-secondary mt-0.5">{p.taskCounts.completed} of {p.taskCounts.total} tasks completed</p>
              </div>

              <div className="flex items-center gap-6 sm:w-72">
                <div className="flex-1">
                  <ProgressBar value={p.progress} size="sm" variant={p.progress === 100 ? 'success' : 'forest'} />
                </div>
                <StatusBadge status={p.status} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overdue Tasks Warning Section */}
      {overdueTasks.length > 0 && (
        <div className="p-6 bg-white rounded-xl border border-status-danger/30 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-status-danger" />
            <h3 className="font-heading font-bold text-sm text-status-danger">
              Attention Required: {overdueTasks.length} Overdue Tasks
            </h3>
          </div>
          <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {overdueTasks.map((t) => (
              <div key={t.id} className="p-3.5 flex items-center justify-between gap-4 bg-status-dangerBg/20">
                <div>
                  <span className="text-xs font-semibold text-charcoal">{t.title}</span>
                  <span className="text-[11px] text-charcoal-secondary block font-mono">
                    Target: {t.dueDate} (Assigned to {t.assignee.name})
                  </span>
                </div>
                <PriorityBadge priority={t.priority} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
