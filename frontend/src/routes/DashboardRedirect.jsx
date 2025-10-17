import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white p-8">
        <div className="animate-pulse opacity-80">Loading dashboard…</div>
      </div>
    );
  }

  if (!user || !user.role) {
    return <Navigate to="/signin" replace />;
  }

  const path = user.role === 'admin' ? '/admin'
    : user.role === 'mediator' ? '/mediator'
    : user.role === 'divorcee' ? '/divorcee'
    : '/lawyer';

  return <Navigate to={path} replace />;
}
