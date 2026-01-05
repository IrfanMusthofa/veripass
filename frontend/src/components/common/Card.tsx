import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { interactiveCard } from '@/lib/animations';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  hover?: boolean;
  interactive?: boolean;
}

interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', hover = false, interactive = false, onClick, ...props }, ref) => {
    const isClickable = hover || interactive || !!onClick;

    return (
      <motion.div
        ref={ref}
        variants={isClickable ? interactiveCard : undefined}
        initial={isClickable ? 'rest' : undefined}
        whileHover={isClickable ? 'hover' : undefined}
        whileTap={isClickable ? 'tap' : undefined}
        className={`
          bg-[var(--color-bg-primary)]
          rounded-[var(--radius-lg)]
          border border-[var(--color-border)]
          shadow-[var(--shadow-sm)]
          transition-[border-color] duration-[var(--transition-fast)]
          ${isClickable ? 'cursor-pointer hover:border-[var(--color-border-hover)]' : ''}
          ${className}
        `}
        onClick={onClick}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export function CardHeader({ children, className = '', ...props }: CardSectionProps) {
  return (
    <div
      className={`
        px-[var(--spacing-5)] py-[var(--spacing-4)]
        border-b border-[var(--color-border)]
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({ children, className = '', ...props }: CardSectionProps) {
  return (
    <div
      className={`px-[var(--spacing-5)] py-[var(--spacing-4)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }: CardSectionProps) {
  return (
    <div
      className={`
        px-[var(--spacing-5)] py-[var(--spacing-4)]
        border-t border-[var(--color-border)]
        bg-[var(--color-bg-secondary)]
        rounded-b-[var(--radius-lg)]
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
