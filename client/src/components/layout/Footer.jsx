import React from 'react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-border mt-auto py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-charcoal-secondary">
        <div className="flex items-center gap-2">
          <span className="font-heading font-semibold text-forest">TeamFlow</span>
          <span>&copy; {new Date().getFullYear()} TeamFlow SaaS. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6">
          <span>Production-Grade MERN Architecture</span>
          <span className="inline-block w-1 h-1 rounded-full bg-sage"></span>
          <span>Stage 00 Foundation</span>
        </div>
      </div>
    </footer>
  );
};
