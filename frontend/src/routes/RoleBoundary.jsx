import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleBoundary({ role, children }) {
  const { user, loading } = useAuth();
  
  // Wait for auth to finish loading before making routing decisions
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/" replace />;
  
  // Allow admin to access all dashboards
  if (user.role === 'admin') return children;
  
  // For non-admin users, check if their role matches
  if (user.role !== role) return <Navigate to="/dashboard" replace />;
  
  return children;
}
