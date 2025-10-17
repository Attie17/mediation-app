import * as React from 'react';
import * as RD from '@radix-ui/react-dialog';
import { cn } from '../../lib/cn';

export const Dialog = RD.Root;
export const DialogTrigger = RD.Trigger;

export function DialogContent({ className, children, ...props }) {
  return (
    <RD.Portal>
      <RD.Overlay className="fixed inset-0 bg-black/50" />
      <RD.Content className={cn('fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-4 text-card-foreground shadow focus:outline-none', className)} {...props}>
        {children}
      </RD.Content>
    </RD.Portal>
  );
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn('mb-2', className)} {...props} />;
}
export function DialogTitle({ className, ...props }) {
  return <h3 className={cn('text-lg font-semibold', className)} {...props} />;
}
export const DialogClose = RD.Close;
