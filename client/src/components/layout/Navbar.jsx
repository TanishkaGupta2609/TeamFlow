import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export const Navbar = () => {
  const location = useLocation();
  const [health, setHealth] = useState({ status: 'checking', message: 'Checking API...' });

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const res = await api.get('/health');
        if (isMounted) {
          setHealth({
            status: 'online',
            dbStatus: res.data?.services?.database?.status || 'unknown',
            message: `API Online (DB: ${res.data?.services?.database?.status || 'ready'})`,
          });
        }
      } catch (err) {
        if (isMounted) {
          setHealth({
            status: 'offline',
            message: 'API Offline',
          });
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { name: 'Overview', path: '/' },
    { name: 'System Status', path: '/status' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-forest flex items-center justify-center text-white font-heading font-bold text-lg shadow-sm">
                <span>TF</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-bold text-xl text-forest tracking-tight">TeamFlow</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-accent"></span>
                </div>
                <span className="text-[11px] text-charcoal-secondary hidden sm:inline-block font-sans">
                  Plan clearly. Work together. Deliver better.
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-4">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-forest/10 text-forest font-semibold'
                      : 'text-charcoal-secondary hover:text-charcoal hover:bg-ivory'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Backend Status Badge */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                health.status === 'online'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : health.status === 'checking'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  health.status === 'online'
                    ? 'bg-emerald-500 animate-pulse'
                    : health.status === 'checking'
                    ? 'bg-amber-500 animate-ping'
                    : 'bg-rose-500'
                }`}
              />
              <span className="hidden md:inline">{health.message}</span>
              <span className="md:hidden">
                {health.status === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
