import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const token = typeof window !== 'undefined' ? localStorage.getItem('teamflow_token') : null;

  // Allow access if token is present or Redux state is authenticated
  const isAuthorized = isAuthenticated || !!token;

  if (!isAuthorized) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
