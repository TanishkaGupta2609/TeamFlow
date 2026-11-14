import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Server, 
  Globe, 
  Database, 
  ShieldCheck, 
  Layers, 
  ArrowRight,
  RefreshCw 
} from 'lucide-react';
import api from '../services/api';

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

  const stackItems = [
    { title: 'Frontend Core', tech: 'React 18 + Vite', desc: 'Ultra-fast HMR and optimized bundler' },
    { title: 'Styling & Design', tech: 'Tailwind CSS + Manrope & Inter', desc: 'B2B SaaS palette (#173F35 Forest, #F7F6F2 Ivory)' },
    { title: 'Routing & State', tech: 'React Router v6 + Redux Toolkit', desc: 'Predictable state and client-side routing' },
    { title: 'Backend API', tech: 'Node.js + Express', desc: 'Modular architecture, JSON parsing, security headers' },
    { title: 'Database', tech: 'MongoDB + Mongoose', desc: 'Enterprise data modeling and persistence' },
    { title: 'API Client', tech: 'Axios Service', desc: 'Configured with interceptors and base endpoints' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-white rounded-xl border border-border p-6 sm:p-10 shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 text-forest text-xs font-semibold mb-4 border border-forest/10">
            <span className="w-2 h-2 rounded-full bg-amber-accent"></span>
            Stage 00 Initialized &amp; Verified
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-charcoal tracking-tight">
            TeamFlow SaaS Foundation
          </h1>
          <p className="mt-3 text-base sm:text-lg text-charcoal-secondary font-sans leading-relaxed">
            Plan clearly. Work together. Deliver better. A production-grade project management application built with the MERN stack.
          </p>
        </div>
      </section>

      {/* Live System Connectivity Card */}
      <section className="bg-white rounded-xl border border-border p-6 shadow-sm">
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

      {/* Architectural Overview */}
      <section className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <h2 className="font-heading font-bold text-xl text-charcoal mb-4">
          Architectural Baseline (Stage 00)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stackItems.map((item, idx) => (
            <div key={idx} className="p-4 rounded-lg border border-border bg-ivory/50 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-dark uppercase tracking-wider">
                  {item.title}
                </span>
                <h3 className="font-heading font-bold text-base text-charcoal mt-1">
                  {item.tech}
                </h3>
                <p className="text-xs text-charcoal-secondary mt-1">
                  {item.desc}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-border/60 flex items-center text-[11px] font-medium text-status-success gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Configured &amp; Verified</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
