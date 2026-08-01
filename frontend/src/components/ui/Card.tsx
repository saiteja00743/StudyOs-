import React from 'react';
import { cn } from '@/utils/cn';

// ─── Card ──────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'glow' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const cardVariants = {
  default:  'bg-surface-850 border border-white/5',
  glass:    'glass',
  glow:     'glass glow-border',
  elevated: 'bg-surface-800 border border-white/8 shadow-card',
};

const cardPadding = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
};

export function Card({
  variant = 'default',
  padding = 'md',
  hover = false,
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl',
        cardVariants[variant],
        cardPadding[padding],
        hover &&
          'transition-all duration-300 hover:scale-[1.02] hover:shadow-card-hover hover:border-brand-500/20 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Card.Header ───────────────────────────────────────────
Card.Header = function CardHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  );
};

// ─── Card.Title ────────────────────────────────────────────
Card.Title = function CardTitle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold text-slate-100', className)} {...props}>
      {children}
    </h3>
  );
};

// ─── Card.Description ─────────────────────────────────────
Card.Description = function CardDescription({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-slate-400 leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
};

// ─── Card.Footer ───────────────────────────────────────────
Card.Footer = function CardFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center gap-3 mt-4 pt-4 border-t border-white/5', className)}
      {...props}
    >
      {children}
    </div>
  );
};
