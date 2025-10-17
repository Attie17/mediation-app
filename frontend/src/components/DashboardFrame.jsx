import React from 'react';

// Slim wrapper for role dashboards that renders ONLY the right content area.
// The outer two-column layout and left greeting pane are provided by HomePage.
export function DashboardFrame({ title, children }) {
  return (
    <div className="text-white h-full box-border p-6">
      <h1 className="text-2xl font-semibold mb-4">{title}</h1>
      <div className="h-[calc(100%-64px)] overflow-auto pr-2">
        {children}
      </div>
    </div>
  );
}

export default DashboardFrame;
