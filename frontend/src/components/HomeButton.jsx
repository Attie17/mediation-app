import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home } from 'lucide-react';
import ConfirmHomeModal from './ConfirmHomeModal';

export default function HomeButton({ className = "" }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleHomeClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmLogout = () => {
    logout();
    navigate('/', { replace: true });
    setShowConfirmModal(false);
  };

  const handleCancelLogout = () => {
    setShowConfirmModal(false);
  };

  return (
    <>
      <button
        onClick={handleHomeClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors ${className}`}
        title="Return to Home Page"
      >
        <Home size={20} />
        <span>Home</span>
      </button>

      <ConfirmHomeModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </>
  );
}
