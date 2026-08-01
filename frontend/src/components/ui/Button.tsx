import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';

// ─── Types ─────────────────────────────────────────────────
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'glow';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  as?: 'button' | 'a';
  href?: string;
}

// ─── Variant Styles ────────────────────────────────────────
const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-gradient text-white shadow-glow hover:shadow-glow-lg hover:scale-[1.02] active:scale-[0.98]',
  secondary:
    'bg-surface-800 text-slate-200 border border-white/10 hover:border-brand-500/40 hover:bg-surface-800/80 hover:text-white',
  ghost:
    'text-slate-300 hover:text-white hover:bg-white/5',
  danger:
    'bg-danger text-white hover:bg-danger/90 hover:scale-[1.02] active:scale-[0.98]',
  outline:
    'border border-brand-500/40 text-brand-300 hover:bg-brand-500/10 hover:border-brand-400',
  glow:
    'bg-brand-500/10 border border-brand-500/30 text-brand-300 hover:bg-brand-500/20 hover:border-brand-400 hover:text-brand-200 shadow-glow-sm hover:shadow-glow',
};

const sizes: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1 rounded-lg',
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
  xl: 'h-14 px-8 text-lg gap-3 rounded-2xl',
};

// ─── Spinner ───────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Shared inner content ──────────────────────────────────
function Inner({ loading, leftIcon, rightIcon, children }: {
  loading: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <>
      {loading ? <Spinner /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </>
  );
}

// ─── Button Component ──────────────────────────────────────
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className,
      disabled,
      as,
      href,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const cls = cn(
      'relative inline-flex items-center justify-center font-semibold',
      'transition-all duration-200 ease-out select-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-950',
      isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
      fullWidth && 'w-full',
      variants[variant],
      sizes[size],
      className
    );

    // ── Render as anchor/link ──────────────────────────────
    if (as === 'a' && href) {
      if (href.startsWith('http') || href.startsWith('mailto') || href.startsWith('#')) {
        return (
          <a href={href} className={cls} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
            <Inner loading={loading} leftIcon={leftIcon} rightIcon={rightIcon}>{children}</Inner>
          </a>
        );
      }
      // Internal route — use React Router Link to avoid full page reload
      return (
        <Link to={href} className={cls}>
          <Inner loading={loading} leftIcon={leftIcon} rightIcon={rightIcon}>{children}</Inner>
        </Link>
      );
    }

    // ── Default: render as button ──────────────────────────
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: isDisabled ? 1 : 0.97 }}
        transition={{ duration: 0.1 }}
        disabled={isDisabled}
        className={cls}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        <Inner loading={loading} leftIcon={leftIcon} rightIcon={rightIcon}>{children}</Inner>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
