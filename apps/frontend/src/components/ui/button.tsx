'use client';

import { forwardRef } from 'react';
import { Spinner } from './spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

const variantClasses = {
  primary: `
    bg-brand-500 text-white font-medium
    hover:bg-brand-400 active:bg-brand-600
    shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30
    disabled:bg-brand-500/50 disabled:shadow-none
  `,
  secondary: `
    bg-white/[0.06] text-slate-200 font-medium
    border border-white/[0.08]
    hover:bg-white/[0.1] hover:border-white/[0.12]
    active:bg-white/[0.08]
    disabled:bg-white/[0.03] disabled:text-slate-500
  `,
  ghost: `
    bg-transparent text-slate-300 font-medium
    hover:bg-white/[0.06] hover:text-white
    active:bg-white/[0.08]
    disabled:text-slate-600
  `,
  danger: `
    bg-red-500/10 text-red-400 font-medium
    border border-red-500/20
    hover:bg-red-500/20 hover:border-red-500/30
    active:bg-red-500/25
    disabled:bg-red-500/5 disabled:text-red-500/50
  `,
  success: `
    bg-emerald-500/10 text-emerald-400 font-medium
    border border-emerald-500/20
    hover:bg-emerald-500/20 hover:border-emerald-500/30
    active:bg-emerald-500/25
    disabled:bg-emerald-500/5 disabled:text-emerald-500/50
  `,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center
          rounded-xl transition-all duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900
          disabled:cursor-not-allowed
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <>
            <Spinner size="sm" className="text-current" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
            {children}
            {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
