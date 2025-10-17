import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const displayName = user?.preferredName || user?.name || 'there';

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 sm:p-8 md:p-12 text-white">
      <div className="w-full max-w-3xl">
        <h3 className="text-2xl font-bold mb-6">Hello {displayName}, here is your dashboard.</h3>
        <div className="flex flex-col gap-4">
          <button
            type="button"
            className="w-full rounded-full border border-white/70 text-white bg-transparent hover:bg-white/10 transition text-base font-semibold flex items-center justify-center px-6 py-3"
          >
            Cases
          </button>
          <button
            type="button"
            className="w-full rounded-full border border-white/70 text-white bg-transparent hover:bg-white/10 transition text-base font-semibold flex items-center justify-center px-6 py-3"
          >
            Documents
          </button>
          <button
            type="button"
            className="w-full rounded-full border border-white/70 text-white bg-transparent hover:bg-white/10 transition text-base font-semibold flex items-center justify-center px-6 py-3"
          >
            Notifications
          </button>
        </div>
      </div>
    </div>
  );
}
