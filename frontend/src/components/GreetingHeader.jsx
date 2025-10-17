import React from 'react';
import { useAuth } from '../context/AuthContext';

function nameFromEmail(email = '') {
  const local = (email.split('@')[0] || '').replace(/\W+/g, ' ');
  return local.replace(/\b\w/g, m => m.toUpperCase());
}

export default function GreetingHeader() {
  const { user } = useAuth();
  const name = user?.preferredName || user?.name || nameFromEmail(user?.email || '') || 'there';
  
  return (
    <div className="mb-3">
      <div className="text-sm opacity-90">Welcome back</div>
      <div className="text-xl font-semibold">{name}</div>
    </div>
  );
}
