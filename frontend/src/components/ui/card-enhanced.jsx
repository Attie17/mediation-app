// Enhanced Card Component with gradients and modern styling
import React from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, children, gradient = false, hover = true, ...props }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border transition-all duration-300",
        gradient 
          ? "bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-white/10 backdrop-blur-sm"
          : "bg-slate-800/30 border-slate-700/50",
        hover && "hover:border-white/20 hover:shadow-xl hover:shadow-teal-500/5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, icon, ...props }) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    >
      {icon && (
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
            {icon}
          </div>
          {children}
        </div>
      )}
      {!icon && children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold leading-none tracking-tight text-slate-100",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn("text-sm text-slate-400", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn("p-6 pt-0", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// Decorative corner element (optional)
export function CardDecoration({ color = "teal" }) {
  const colorMap = {
    teal: "from-teal-500/10",
    blue: "from-blue-500/10",
    coral: "from-orange-500/10",
    sage: "from-lime-500/10"
  };
  
  return (
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorMap[color]} to-transparent rounded-bl-full pointer-events-none`} />
  );
}
