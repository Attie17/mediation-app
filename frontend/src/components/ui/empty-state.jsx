// Empty State Component - Warm and encouraging
import React from 'react';
import { cn } from '@/lib/cn';

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  actionLabel,
  className 
}) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-6 text-center",
      className
    )}>
      {/* Decorative circle background */}
      {icon && (
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500/20 to-blue-500/20 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500/30 to-blue-500/30 flex items-center justify-center">
              {React.cloneElement(icon, { 
                className: cn(icon.props.className, "w-8 h-8 text-teal-400") 
              })}
            </div>
          </div>
          {/* Floating decorative dots */}
          <div className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-teal-400/40 animate-pulse" />
          <div className="absolute -bottom-1 -left-3 w-2 h-2 rounded-full bg-blue-400/40 animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-slate-200 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-6 max-w-sm leading-relaxed">{description}</p>
      
      {action && actionLabel && (
        <button 
          onClick={action}
          className="
            px-6 py-2.5 rounded-lg
            bg-gradient-to-r from-teal-500 to-blue-500
            text-white font-medium text-sm
            hover:shadow-lg hover:shadow-teal-500/25
            transition-all duration-300
            hover:scale-105
            relative overflow-hidden
            group
          "
        >
          <span className="relative z-10">{actionLabel}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
        </button>
      )}
    </div>
  );
}

// Preset empty states for common scenarios
export function NoSessionsEmpty({ onSchedule }) {
  return (
    <EmptyState
      icon={<div className="text-2xl">📅</div>}
      title="No sessions scheduled"
      description="You're all caught up! When sessions are scheduled, they'll appear here."
      action={onSchedule}
      actionLabel="Schedule a Session"
    />
  );
}

export function NoCasesEmpty({ onBrowse }) {
  return (
    <EmptyState
      icon={<div className="text-2xl">📋</div>}
      title="No cases assigned yet"
      description="Once you're assigned to a case, you'll see all the details here. Check back soon!"
      action={onBrowse}
      actionLabel="Browse Cases"
    />
  );
}

export function NoUploadsEmpty() {
  return (
    <EmptyState
      icon={<div className="text-2xl">📎</div>}
      title="No uploads to review"
      description="Great news! All documents have been reviewed. You'll be notified when new uploads need your attention."
    />
  );
}

export function NoNotificationsEmpty() {
  return (
    <EmptyState
      icon={<div className="text-2xl">🔔</div>}
      title="You're all caught up!"
      description="No new notifications right now. We'll let you know when there's something that needs your attention."
    />
  );
}
