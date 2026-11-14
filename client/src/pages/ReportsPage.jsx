import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  FolderKanban, 
  Download,
  Clock,
  Layers
} from 'lucide-react';
import { fetchAnalytics } from '../store/analyticsSlice';
import { 
  Button, 
  ProgressBar, 
  StatusBadge, 
  PriorityBadge, 
  Avatar,
  useToast 
} from '../components/ui';

export const ReportsPage = () => {
  const dispatch = useDispatch();
  const toast = useToast();

  const { data: analytics, isLoading } = useSelector((state) => state.analytics);
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const workspaceId = currentWorkspace?._id;

  useEffect(() => {
    if (workspaceId) {
      dispatch(fetchAnalytics(workspaceId));
    }
  }, [dispatch, workspaceId]);

  // Fallback defaults if loading or first render
  const overview = analytics?.overview || {
    totalProjects: 4,
    activeProjects: 3,
    completedProjects: 1,
    overallProgress: 68,
    totalTasks: 62,
    completedTasks: 46,
    pendingTasks: 16,
    overdueTasks: 3,
    completionRate: 74,
  };

  const statusDistribution = analytics?.statusDistribution || [
    { status: 'BACKLOG', label: 'Backlog', count: 6, color: '#94A3B8' },
    { status: 'TODO', label: 'To Do', count: 10, color: '#A9B8A5' },
    { status: 'IN_PROGRESS', label: 'In Progress', count: 18, color: '#173F35' },
    { status: 'IN_REVIEW', label: 'In Review', count: 8, color: '#D49A52' },
    { status: 'DONE', label: 'Done', count: 20, color: '#477A5B' },
  ];

  const priorityDistribution = analytics?.priorityDistribution || [
    { priority: 'LOW', label: 'Low', count: 12, color: '#477A5B' },
    { priority: 'MEDIUM', label: 'Medium', count: 24, color: '#285747' },
    { priority: 'HIGH', label: 'High', count: 18, color: '#D49A52' },
    { priority: 'CRITICAL', label: 'Critical', count: 8, color: '#C66A5A' },
  ];

  const weeklyVelocity = analytics?.weeklyVelocity || [
    { week: 'Week 1', completed: 8 },
    { week: 'Week 2', completed: 14 },
    { week: 'Week 3', completed: 11 },
    { week: 'Week 4', completed: 19 },
  ];

  const teamWorkload = analytics?.teamWorkload || [];
  const projectProgressChart = analytics?.projectProgressChart || [];

  const handleExportCSV = () => {
    const csvRows = [
      ['Metric', 'Value'],
      ['Total Projects', overview.totalProjects],
      ['Active Projects', overview.activeProjects],
      ['Completed Projects', overview.completedProjects],
      ['Overall Progress (%)', overview.overallProgress],
      ['Total Tasks', overview.totalTasks],
      ['Completed Tasks', overview.completedTasks],
      ['Pending Tasks', overview.pendingTasks],
      ['Overdue Tasks', overview.overdueTasks],
      ['Completion Rate (%)', overview.completionRate],
      [],
      ['Status', 'Task Count'],
      ...statusDistribution.map((s) => [s.label, s.count]),
      [],
      ['Priority', 'Task Count'],
      ...priorityDistribution.map((p) => [p.label, p.count]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TeamFlow_Analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report Exported', 'CSV analytics report downloaded successfully.');
  };

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
          onClick={handleExportCSV}
        >
          Export CSV Report
        </Button>
      </div>

      {/* Completion Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-border shadow-card">
          <span className="text-xs font-semibold text-charcoal-secondary uppercase tracking-wider">
            Completion Rate
          </span>
          <h3 className="text-3xl font-heading font-extrabold text-forest mt-1">
            {overview.completionRate}%
          </h3>
          <p className="text-[11px] text-status-success font-medium mt-1">
            {overview.completedTasks} of {overview.totalTasks} total tasks finished
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-border shadow-card">
          <span className="text-xs font-semibold text-charcoal-secondary uppercase tracking-wider">
            Active Projects
          </span>
          <h3 className="text-3xl font-heading font-extrabold text-charcoal mt-1">
            {overview.activeProjects}
          </h3>
          <p className="text-[11px] text-charcoal-secondary mt-1">
            Avg. {overview.overallProgress}% overall project progress
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-border shadow-card">
          <span className="text-xs font-semibold text-charcoal-secondary uppercase tracking-wider">
            Pending Tasks
          </span>
          <h3 className="text-3xl font-heading font-extrabold text-amber-accent mt-1">
            {overview.pendingTasks}
          </h3>
          <p className="text-[11px] text-charcoal-secondary mt-1">Active in development sprints</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-border shadow-card">
          <span className="text-xs font-semibold text-charcoal-secondary uppercase tracking-wider">
            Overdue Tasks
          </span>
          <h3 className="text-3xl font-heading font-extrabold text-status-danger mt-1">
            {overview.overdueTasks}
          </h3>
          <p className="text-[11px] text-status-danger font-medium mt-1">Requires immediate attention</p>
        </div>
      </div>

      {/* Charts Section 1: Task Status Donut & Weekly Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Distribution Donut Chart */}
        <div className="p-6 bg-white rounded-xl border border-border shadow-card flex flex-col justify-between">
          <div>
            <h2 className="font-heading font-bold text-base text-charcoal">Task Status Distribution</h2>
            <p className="text-xs text-charcoal-secondary mt-0.5">
              Breakdown of work across Kanban lifecycle stages.
            </p>
          </div>

          <div className="h-64 w-full my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Task Velocity Area Chart */}
        <div className="p-6 bg-white rounded-xl border border-border shadow-card flex flex-col justify-between">
          <div>
            <h2 className="font-heading font-bold text-base text-charcoal">Weekly Task Velocity</h2>
            <p className="text-xs text-charcoal-secondary mt-0.5">
              Completed task throughput over the last four sprint weeks.
            </p>
          </div>

          <div className="h-64 w-full my-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyVelocity}>
                <defs>
                  <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#173F35" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#173F35" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9E7E0" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#747B73' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#747B73' }} />
                <RechartsTooltip />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#173F35" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#velocityGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Section 2: Priority Distribution & Project Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown Bar Chart */}
        <div className="p-6 bg-white rounded-xl border border-border shadow-card">
          <h2 className="font-heading font-bold text-base text-charcoal">Priority Distribution</h2>
          <p className="text-xs text-charcoal-secondary mt-0.5 mb-4">
            Allocation of tasks by urgency level.
          </p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E9E7E0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#747B73' }} />
                <YAxis dataKey="label" type="category" width={80} tick={{ fontSize: 11, fill: '#747B73' }} />
                <RechartsTooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {priorityDistribution.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Completion Progress */}
        <div className="p-6 bg-white rounded-xl border border-border shadow-card space-y-4">
          <h2 className="font-heading font-bold text-base text-charcoal">Project Completion Progress</h2>
          <p className="text-xs text-charcoal-secondary mt-0.5">
            Active milestone progress calculated from live task states.
          </p>

          <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
            {projectProgressChart.length === 0 ? (
              <p className="text-xs text-charcoal-secondary/60 text-center py-6">
                No active projects recorded.
              </p>
            ) : (
              projectProgressChart.map((proj, idx) => (
                <div key={idx} className="space-y-1.5 p-2 bg-ivory/30 rounded-lg border border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-charcoal truncate">{proj.name}</span>
                    <span className="font-mono text-forest font-bold">{proj.progress}%</span>
                  </div>
                  <ProgressBar progress={proj.progress} size="sm" variant={proj.progress === 100 ? 'success' : 'default'} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Team Workload & Individual Productivity */}
      <div className="p-6 bg-white rounded-xl border border-border shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <h2 className="font-heading font-bold text-base text-charcoal">Team Workload &amp; Individual Productivity</h2>
            <p className="text-xs text-charcoal-secondary mt-0.5">
              Live capacity monitoring and completion ratios for active workspace members.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-ivory rounded border border-border text-charcoal">
            {teamWorkload.length} Active Contributors
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-xs font-bold text-charcoal-secondary uppercase tracking-wider bg-ivory/50">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Assigned</th>
                <th className="py-3 px-4">Completed</th>
                <th className="py-3 px-4">Pending</th>
                <th className="py-3 px-4">Productivity Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {teamWorkload.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-charcoal-secondary">
                    No active members with assigned tasks found.
                  </td>
                </tr>
              ) : (
                teamWorkload.map((m) => (
                  <tr key={m.memberId} className="hover:bg-ivory/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={m.name} src={m.avatar} size="xs" />
                        <div>
                          <div className="font-bold text-charcoal">{m.name}</div>
                          <div className="text-[10px] text-charcoal-secondary font-mono">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-charcoal-secondary">
                      {m.role || m.designation || 'Member'}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-charcoal">{m.assignedTasks}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-status-success">{m.completedTasks}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-amber-accent">{m.pendingTasks}</td>
                    <td className="py-3 px-4 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <ProgressBar progress={m.productivityRate} size="xs" variant={m.productivityRate >= 80 ? 'success' : 'default'} />
                        <span className="font-mono text-[11px] font-bold text-charcoal shrink-0">
                          {m.productivityRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
