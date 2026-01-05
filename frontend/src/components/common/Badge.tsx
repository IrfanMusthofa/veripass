import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  icon?: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]',
  success: 'bg-[var(--color-accent-green-light)] text-[var(--color-accent-green)]',
  warning: 'bg-[var(--color-accent-yellow-light)] text-[var(--color-accent-orange)]',
  error: 'bg-[var(--color-accent-red-light)] text-[var(--color-accent-red)]',
  info: 'bg-[rgba(35,131,226,0.1)] text-[var(--color-accent-blue)]',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-[var(--spacing-2)] py-0.5 text-[var(--font-size-xs)]',
  md: 'px-[var(--spacing-3)] py-[var(--spacing-1)] text-[var(--font-size-sm)]',
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  icon,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1
        font-medium
        rounded-[var(--radius-full)]
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
