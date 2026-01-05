import { type HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  className = '',
  ...props
}: SkeletonProps) {
  const baseStyles = `
    skeleton-shimmer
    bg-[var(--color-bg-secondary)]
    rounded-[var(--radius-md)]
  `;

  const variantStyles = {
    text: 'h-4 w-full',
    rectangular: '',
    circular: 'rounded-full',
  };

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseStyles} ${variantStyles.text}`}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : style.width,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${className}
      `}
      style={style}
      {...props}
    />
  );
}

// Preset skeleton components
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return <Skeleton variant="text" lines={lines} />;
}

export function SkeletonCard() {
  return (
    <div className="p-[var(--spacing-4)] space-y-4">
      <Skeleton variant="rectangular" height={200} />
      <Skeleton variant="text" lines={2} />
      <div className="flex gap-2">
        <Skeleton variant="circular" width={32} height={32} />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton variant="circular" width={size} height={size} />;
}

export function SkeletonButton() {
  return <Skeleton variant="rectangular" width={100} height={36} />;
}
