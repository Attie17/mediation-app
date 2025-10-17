import * as React from 'react';
import * as DM from '@radix-ui/react-dropdown-menu';
import { cn } from '../../lib/cn';

export const DropdownMenu = DM.Root;
export const DropdownMenuTrigger = DM.Trigger;
export const DropdownMenuContent = ({ className, ...props }) => (
  <DM.Portal>
    <DM.Content className={cn('z-50 min-w-[10rem] overflow-hidden rounded-md border bg-card p-1 text-card-foreground shadow-md', className)} {...props} />
  </DM.Portal>
);
export const DropdownMenuItem = ({ className, ...props }) => (
  <DM.Item className={cn('relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-muted', className)} {...props} />
);
