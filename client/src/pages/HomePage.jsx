import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Server, 
  Globe, 
  Database, 
  ShieldCheck, 
  Layers, 
  ArrowRight, 
  RefreshCw, 
  Palette,
  FolderKanban,
  Kanban,
  CheckSquare,
  Users,
  BarChart3,
  Calendar,
  Lock
} from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/Button';

export const HomePage = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/health');
      setHealthData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const screens = [
    { title: 'Overview Dashboard', path: '/dashboard', icon: <Layers className="w-5 h-5 text-forest" />, desc: 'Workspace KPIs, velocity charts, active projects, and live activity feeds.' },
    { title: 'Project Management', path: '/projects', icon: <FolderKanban className="w-5 h-5 text-forest" />, desc: 'Grid and list views, progress tracking, deadlines, and project modal creation.' },
    { title: 'My Tasks Center', path: '/tasks', icon: <CheckSquare className="w-5 h-5 text-forest" />, desc: 'Sprint task filters (assigned, created, overdue, completed) and sorting.' },
    { title: 'Kanban Workflow Board', path: '/kanban', icon: <Kanban className="w-5 h-5 text-forest" />, desc: '5 status columns with rich task cards, comment counts, and column transitions.' },
    { title: 'Delivery Calendar', path: '/calendar', icon: <Calendar className="w-5 h-5 text-forest" />, desc: 'Month and week milestone timeline with project and task deadlines.' },
    { title: 'Team & Permissions', path: '/team', icon: <Users className="w-5 h-5 text-forest" />, desc: 'Collaborator table, role assignments, invite modal, and status indicators.' },
    { title: 'Reports & Analytics', path: '/reports', icon: <BarChart3 className="w-5 h-5 text-forest" />, desc: 'Completion rates, task status distribution, and velocity per member.' },
    { title: 'Split-Screen Authentication', path: '/login', icon: <Lock className="w-5 h-5 text-forest" />, desc: 'Production login, registration, password recovery, and invite flows.' },
  ];

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="bg-white rounded-xl border border-border p-6 sm:p-10 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 text-forest text-xs font-semibold mb-4 border border-forest/10">
              <span className="w-2 h-2 rounded-full bg-amber-accent"></span>
              Stage 02 Frontend Application Implemented
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-charcoal tracking-tight">
              TeamFlow Project Management SaaS
            </h1>
            <p className="mt-3 text-base sm:text-lg text-charcoal-secondary font-sans leading-relaxed">
              Plan clearly. Work together. Deliver better. A complete, responsive B2B SaaS application built with the MERN stack.
            </p>
          </div>
          <div className="shrink-0 flex flex-wrap gap-3">
            <Link to="/dashboard">
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Launch App Dashboard
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="md">
                View Auth Screens
              </Button>
            </Link>
            <Link to="/design-system">
              <Button variant="outline" size="md" leftIcon={<Palette className="w-4 h-4" />}>
                UI System
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Screens Navigation Showcase */}
      <section className="space-y-4">
        <div>
          <h2 className="font-heading font-bold text-xl text-charcoal">
            Stage 02 Frontend Screens
          </h2>
          <p className="text-xs text-charcoal-secondary mt-0.5">
            Every main application screen is built, fully styled, responsive, and ready for exploration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {screens.map((sc, idx) => (
            <Link
              key={idx}
              to={sc.path}
              className="p-5 rounded-xl border border-border bg-white shadow-card hover:border-forest hover:shadow-elevated transition-all duration-150 flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-forest/5 flex items-center justify-center mb-3 group-hover:bg-forest/10 transition-colors">
                  {sc.icon}
                </div>
                <h3 className="font-heading font-bold text-sm text-charcoal group-hover:text-forest transition-colors">
                  {sc.title}
                </h3>
                <p className="text-xs text-charcoal-secondary mt-1 leading-relaxed">
                  {sc.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-semibold text-forest">
                <span>Open Screen</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Live System Connectivity Card */}
      <section className="bg-white rounded-xl border border-border p-6 shadow-card">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-forest/10 text-forest flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-charcoal">System Health &amp; Backend Connectivity</h2>
              <p className="text-xs text-charcoal-secondary">Live check via GET /api/health</p>
            </div>
          </div>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-forest hover:bg-forest/5 rounded-md border border-border transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-ivory border border-border">
            <div className="flex items-center justify-between text-xs text-charcoal-secondary">
              <span>API Status</span>
              <Globe className="w-4 h-4 text-forest" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${healthData?.status === 'ok' ? 'bg-status-success' : 'bg-status-danger'}`}></span>
              <span className="font-heading font-bold text-base text-charcoal capitalize">
                {loading ? 'Checking...' : healthData?.status || 'Offline'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-charcoal-secondary">
              {healthData?.app || (error ? error : 'Backend service')}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-ivory border border-border">
            <div className="flex items-center justify-between text-xs text-charcoal-secondary">
              <span>Database Connection</span>
              <Database className="w-4 h-4 text-forest" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                healthData?.services?.database?.status === 'connected' ? 'bg-status-success' : 'bg-status-warning'
              }`}></span>
              <span className="font-heading font-bold text-base text-charcoal capitalize">
                {loading ? 'Checking...' : healthData?.services?.database?.status || 'Pending'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-charcoal-secondary">
              {healthData?.services?.database?.details || 'Mongoose driver state'}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-ivory border border-border">
            <div className="flex items-center justify-between text-xs text-charcoal-secondary">
              <span>Environment &amp; Uptime</span>
              <ShieldCheck className="w-4 h-4 text-forest" />
            </div>
            <div className="mt-2 font-heading font-bold text-base text-charcoal">
              {loading ? '...' : `${healthData?.environment || 'development'} | ${healthData?.uptime || '0s'}`}
            </div>
            <p className="mt-1 text-[11px] text-charcoal-secondary">
              Server time: {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleTimeString() : 'N/A'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
