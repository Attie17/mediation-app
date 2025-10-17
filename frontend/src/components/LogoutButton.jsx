import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';

export default function LogoutButton({ className = '' }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await Promise.resolve(logout());
    } finally {
      navigate('/', { replace: true });
    }
  };
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleLogout}
      className={`text-white border-white/30 hover:bg-red-500/20 hover:border-red-500/50 ${className}`}
    >
      Logout
    </Button>
  );
}
