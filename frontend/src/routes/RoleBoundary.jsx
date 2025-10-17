import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleBoundary({ role, children }) {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/signin" replace />;
  
  // Allow admin to access all dashboards
  if (user.role === 'admin') return children;
  
  // For non-admin users, check if their role matches
  if (user.role !== role) return <Navigate to="/dashboard" replace />;
  
  return children;
}
