import React, { createContext, useContext, useMemo, useState } from 'react';
import { cn } from '../../lib/cn';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const api = useMemo(() => ({
    show: (message, variant = 'default') => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t, { id, message, variant }]);
      setTimeout(() => dismiss(id), 3500);
    },
  }), []);
  function dismiss(id) { setToasts((t) => t.filter((x) => x.id !== id)); }
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={cn('rounded-md border p-3 bg-card text-card-foreground shadow', t.variant === 'destructive' ? 'border-destructive bg-destructive text-destructive-foreground' : '')}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
