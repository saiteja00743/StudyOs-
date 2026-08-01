import React from 'react';
import { cn } from '@/utils/cn';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-slate-300 border border-white/10',
  primary: 'bg-brand-500/15 text-brand-300 border border-brand-500/20',
  success: 'bg-success/15 text-green-300 border border-success/20',
  warning: 'bg-warning/15 text-yellow-300 border border-warning/20',
  danger:  'bg-danger/15 text-red-300 border border-danger/20',
  info:    'bg-info/15 text-blue-300 border border-info/20',
  outline: 'border border-brand-500/40 text-brand-300 bg-transparent',
};

const sizes: Record<BadgeSize, string> = {
  sm: 'text-2xs px-1.5 py-0.5 rounded-md',
  md: 'text-xs px-2.5 py-1 rounded-lg',
  lg: 'text-sm px-3 py-1.5 rounded-xl',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  primary: 'bg-brand-400',
  success: 'bg-success',
  warning: 'bg-warning',
  danger:  'bg-danger',
  info:    'bg-info',
  outline: 'bg-brand-400',
};

export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}
