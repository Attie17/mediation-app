import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NavigationArrows({ className = '' }) {
  const navigate = useNavigate();

  const goBack = () => {
    try {
      navigate(-1);
    } catch {
      navigate('/');
    }
  };
  const goForward = () => {
    try {
      navigate(1);
    } catch {
      // no-op; react-router handles history bounds
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={goBack}
        title="Back"
        aria-label="Back"
        className="rounded-full border border-white/30 text-white/90 hover:text-white hover:bg-white/10 w-8 h-8 flex items-center justify-center transition"
      >
        <span aria-hidden>{'\u2190'}</span>
      </button>
      <button
        onClick={goForward}
        title="Forward"
        aria-label="Forward"
        className="rounded-full border border-white/30 text-white/90 hover:text-white hover:bg-white/10 w-8 h-8 flex items-center justify-center transition"
      >
        <span aria-hidden>{'\u2192'}</span>
      </button>
    </div>
  );
}
