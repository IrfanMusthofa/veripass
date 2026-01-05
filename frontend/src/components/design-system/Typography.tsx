import { type ReactNode, type HTMLAttributes, createElement } from 'react';

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
}

interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  variant?: 'default' | 'secondary' | 'muted';
  size?: 'sm' | 'base' | 'lg';
  children: ReactNode;
}

interface CaptionProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

const headingStyles: Record<number, string> = {
  1: 'text-[var(--font-size-3xl)] font-bold leading-[var(--line-height-tight)]',
  2: 'text-[var(--font-size-2xl)] font-semibold leading-[var(--line-height-tight)]',
  3: 'text-[var(--font-size-xl)] font-semibold leading-[var(--line-height-tight)]',
  4: 'text-[var(--font-size-lg)] font-semibold leading-[var(--line-height-normal)]',
  5: 'text-[var(--font-size-base)] font-semibold leading-[var(--line-height-normal)]',
  6: 'text-[var(--font-size-sm)] font-semibold leading-[var(--line-height-normal)]',
};

const textVariantStyles: Record<string, string> = {
  default: 'text-[var(--color-text-primary)]',
  secondary: 'text-[var(--color-text-secondary)]',
  muted: 'text-[var(--color-text-muted)]',
};

const textSizeStyles: Record<string, string> = {
  sm: 'text-[var(--font-size-sm)]',
  base: 'text-[var(--font-size-base)]',
  lg: 'text-[var(--font-size-lg)]',
};

export function Heading({
  level = 2,
  children,
  className = '',
  ...props
}: HeadingProps) {
  return createElement(
    `h${level}`,
    {
      className: `
        text-[var(--color-text-primary)]
        ${headingStyles[level]}
        ${className}
      `.trim(),
      ...props,
    },
    children
  );
}

export function Text({
  variant = 'default',
  size = 'base',
  children,
  className = '',
  ...props
}: TextProps) {
  return (
    <p
      className={`
        leading-[var(--line-height-normal)]
        ${textVariantStyles[variant]}
        ${textSizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </p>
  );
}

export function Caption({ children, className = '', ...props }: CaptionProps) {
  return (
    <span
      className={`
        text-[var(--font-size-xs)]
        text-[var(--color-text-muted)]
        leading-[var(--line-height-normal)]
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}

export function Code({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <code
      className={`
        px-[var(--spacing-1)] py-0.5
        bg-[var(--color-bg-tertiary)]
        rounded-[var(--radius-sm)]
        font-[var(--font-family-mono)]
        text-[var(--font-size-sm)]
        text-[var(--color-accent-red)]
        ${className}
      `}
      {...props}
    >
      {children}
    </code>
  );
}
