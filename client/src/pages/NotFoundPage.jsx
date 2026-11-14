import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="text-center py-16">
      <p className="text-sm font-semibold text-amber-dark uppercase tracking-wide">404 Error</p>
      <h1 className="mt-2 text-4xl font-heading font-extrabold text-charcoal tracking-tight">Page not found</h1>
      <p className="mt-2 text-base text-charcoal-secondary">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-forest rounded-lg hover:bg-forest-hover transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
