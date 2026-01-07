'use client';

import { forwardRef } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const variantClasses = {
  default: 'bg-surface-800/80 border border-white/[0.06]',
  elevated: 'bg-surface-800/90 border border-white/[0.08] shadow-xl shadow-black/20',
  outlined: 'bg-transparent border border-white/[0.1]',
  glass: 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', padding = 'md', animate = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          rounded-2xl transition-all duration-300
          ${variantClasses[variant]}
          ${paddingClasses[padding]}
          ${animate ? 'animate-fade-in-up' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, description, action, className = '', ...props }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between mb-6 ${className}`} {...props}>
      <div>
        <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
        {description && (
          <p className="text-sm text-slate-400 mt-1">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className = '', children, ...props }: CardContentProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}
