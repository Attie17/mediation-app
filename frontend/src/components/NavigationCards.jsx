import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';

export function NavigationCard({ 
  icon, 
  label, 
  path, 
  authorized = true,
  badge,
  gradient = 'from-slate-700/30 to-slate-800/30'
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (authorized) {
      navigate(path);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!authorized}
      className={cn(
        "relative overflow-hidden rounded-lg p-6 text-left transition-all duration-200",
        "border",
        authorized ? [
          `bg-gradient-to-br ${gradient}`,
          "border-slate-600/50 hover:border-teal-500/50",
          "hover:scale-[1.03] hover:shadow-lg",
          "cursor-pointer"
        ] : [
          "bg-slate-800/30 border-slate-700/30",
          "cursor-not-allowed opacity-60"
        ]
      )}
    >
      {/* Icon */}
      <div className={cn(
        "w-12 h-12 rounded-lg flex items-center justify-center mb-4",
        authorized ? "bg-white/10" : "bg-slate-700/30"
      )}>
        <span className="text-3xl">{icon}</span>
      </div>

      {/* Label */}
      <div className={cn(
        "text-base font-semibold mb-2",
        authorized ? "text-slate-100" : "text-slate-500"
      )}>
        {label}
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2 text-xs">
        {authorized ? (
          <>
            <span className="text-lime-400">✓</span>
            <span className="text-slate-400">Access</span>
          </>
        ) : (
          <>
            <span className="text-slate-500">🔒</span>
            <span className="text-slate-500">Locked</span>
          </>
        )}
      </div>

      {/* Optional Badge */}
      {badge && authorized && (
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-teal-500/20 text-teal-400 text-xs font-semibold">
          {badge}
        </div>
      )}

      {/* Hover gradient overlay for authorized cards */}
      {authorized && (
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/0 via-teal-500/0 to-teal-500/5 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
      )}
    </button>
  );
}

export function QuickActionCard({ 
  icon, 
  label, 
  value,
  gradient = 'from-teal-500 to-blue-500',
  onClick
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-xl p-6 text-left",
        `bg-gradient-to-br ${gradient}`,
        "text-white",
        "hover:shadow-xl hover:shadow-teal-500/25",
        "transition-all duration-200",
        "hover:scale-[1.05]",
        "group"
      )}
    >
      {/* Icon */}
      <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center mb-4">
        <span className="text-4xl">{icon}</span>
      </div>

      {/* Label */}
      <div className="text-lg font-semibold mb-1">
        {label}
      </div>

      {/* Value */}
      {value && (
        <div className="text-sm opacity-90">
          {value}
        </div>
      )}

      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
    </button>
  );
}
