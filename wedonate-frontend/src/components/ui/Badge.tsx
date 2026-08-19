import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  className?: string;
}

const variants = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  default: 'bg-gray-100 text-gray-700',
};

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
      variants[variant], className
    )}>
      {children}
    </span>
  );
}

export function statusVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'APPROVED': case 'SUCCESS': case 'DISTRIBUTED': return 'success';
    case 'PENDING': return 'warning';
    case 'REJECTED': case 'FAILED': case 'CANCELLED': return 'danger';
    default: return 'info';
  }
}
