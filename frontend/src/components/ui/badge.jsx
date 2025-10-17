import * as React from 'react';
import { cn } from '../../lib/cn';

export function Badge({ className, variant = 'default', ...props }) {
  const styles =
    variant === 'default'
      ? 'bg-secondary text-secondary-foreground'
      : variant === 'success'
      ? 'bg-green-600 text-white'
      : variant === 'warning'
      ? 'bg-yellow-500 text-black'
      : variant === 'destructive'
      ? 'bg-destructive text-destructive-foreground'
      : 'bg-muted text-muted-foreground';
  return <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', styles, className)} {...props} />;
}
