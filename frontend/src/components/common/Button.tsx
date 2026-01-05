import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { buttonTap } from '@/lib/animations';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-[var(--color-accent-blue)] text-white
    hover:bg-[var(--color-accent-blue-hover)]
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  secondary: `
    bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]
    hover:bg-[var(--color-bg-tertiary)]
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  outline: `
    border border-[var(--color-border)] text-[var(--color-text-primary)] bg-transparent
    hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-hover)]
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  danger: `
    bg-[var(--color-accent-red)] text-white
    hover:opacity-90
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  ghost: `
    text-[var(--color-text-secondary)] bg-transparent
    hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[var(--font-size-sm)]',
  md: 'h-9 px-4 text-[var(--font-size-sm)]',
  lg: 'h-10 px-5 text-[var(--font-size-base)]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
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
      <motion.button
        ref={ref}
        whileTap={!isDisabled ? buttonTap : undefined}
        className={`
          inline-flex items-center justify-center gap-2
          rounded-[var(--radius-md)]
          font-medium
          transition-colors duration-[var(--transition-fast)]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
