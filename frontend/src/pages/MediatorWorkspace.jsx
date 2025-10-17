import React from 'react';

export default function MediatorWorkspace() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 sm:p-8 md:p-12 text-white">
      <div className="w-full max-w-md">
  <h3 className="text-2xl font-bold mb-4">Mediator Dashboard</h3>
        <p className="mb-6 text-lg">Manage sessions, track progress, and compile mediator reports.</p>
        <button type="button" className="rounded-full bg-white text-blue-700 font-semibold px-5 py-2 hover:bg-blue-50 transition">View assigned cases</button>
      </div>
    </div>
  );
}
