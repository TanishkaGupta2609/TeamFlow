import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-ivory">
      {/* Left Brand Showcase Banner */}
      <div className="md:w-5/12 lg:w-1/2 bg-forest text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative background gradient/dots */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-forest-secondary/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-forest-dark/80 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-ivory text-forest flex items-center justify-center font-heading font-bold text-lg shadow-subtle">
              TF
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-2xl text-white tracking-tight">TeamFlow</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-accent"></span>
            </div>
          </Link>
          <p className="text-xs text-sage mt-1 font-sans">
            Plan clearly. Work together. Deliver better.
          </p>
        </div>

        <div className="relative z-10 my-12 md:my-0 space-y-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-white leading-tight">
            The project management platform designed for high-velocity teams.
          </h2>

          <div className="space-y-3 pt-2">
            {[
              'Multi-tenant workspaces with granular role-based security',
              'Smooth Kanban boards with real-time drag-and-drop',
              'Predictable sprint analytics and velocity tracking',
              'Collaborative task threads and audit log history',
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm text-ivory/90">
                <CheckCircle2 className="w-4 h-4 text-amber-accent shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t border-forest-secondary text-xs text-sage/80 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} TeamFlow Technologies</span>
          <span className="font-mono">MERN Enterprise v1.0</span>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl border border-border shadow-card">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
