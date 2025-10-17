// Enhanced Progress Component
import React from 'react';
import { cn } from '@/lib/cn';

export function ProgressBar({ 
  current, 
  total, 
  showPercentage = true,
  showMilestones = false,
  className,
  title,
  description
}) {
  const percentage = Math.min(100, Math.round((current / total) * 100));
  
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="flex items-start justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-slate-100">{title}</h3>}
            {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
          </div>
          {showPercentage && (
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
                {percentage}%
              </div>
              <div className="text-xs text-slate-400">{current} of {total} complete</div>
            </div>
          )}
        </div>
      )}
      
      {/* Progress bar */}
      <div className="relative h-3 bg-slate-700/50 rounded-full overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        >
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>
      
      {/* Milestone indicators */}
      {showMilestones && (
        <div className="flex justify-between text-xs">
          <span className="text-teal-400 font-semibold">Started</span>
          <span className={percentage >= 50 ? 'text-teal-400 font-semibold' : 'text-slate-500'}>
            Halfway
          </span>
          <span className={percentage >= 100 ? 'text-teal-400 font-semibold' : 'text-slate-500'}>
            Complete!
          </span>
        </div>
      )}
      
      {/* Encouragement text */}
      {percentage > 0 && percentage < 100 && (
        <p className="text-sm text-center text-slate-300">
          {percentage < 25 && "Great start! Keep going! 💪"}
          {percentage >= 25 && percentage < 50 && "You're making good progress! 🌟"}
          {percentage >= 50 && percentage < 75 && "Halfway there! You're doing amazing! 🎯"}
          {percentage >= 75 && percentage < 100 && "Almost there! The finish line is in sight! 🚀"}
        </p>
      )}
      
      {percentage >= 100 && (
        <p className="text-sm text-center font-semibold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
          ✨ Completed! Fantastic work! ✨
        </p>
      )}
    </div>
  );
}

// Circular progress variant
export function CircularProgress({ current, total, size = "md", label }) {
  const percentage = Math.min(100, Math.round((current / total) * 100));
  const circumference = 2 * Math.PI * 40; // radius = 40
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  };
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn("relative", sizeClasses[size])}>
        <svg className="transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-700/50"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
            {percentage}%
          </span>
        </div>
      </div>
      {label && <span className="text-sm text-slate-400">{label}</span>}
    </div>
  );
}
