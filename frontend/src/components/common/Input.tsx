import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-primary)] mb-[var(--spacing-1)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full h-9
            px-[var(--spacing-3)] py-[var(--spacing-2)]
            bg-[var(--color-bg-secondary)]
            border border-transparent
            rounded-[var(--radius-md)]
            text-[var(--font-size-sm)] text-[var(--color-text-primary)]
            placeholder:text-[var(--color-text-muted)]
            transition-all duration-[var(--transition-fast)]
            focus:outline-none focus:bg-[var(--color-bg-primary)]
            focus:border-[var(--color-border-focus)]
            focus:ring-1 focus:ring-[var(--color-border-focus)]
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-[var(--color-accent-red)] bg-[var(--color-accent-red-light)]' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-[var(--spacing-1)] text-[var(--font-size-xs)] text-[var(--color-accent-red)]">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-[var(--spacing-1)] text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, rows = 4, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-primary)] mb-[var(--spacing-1)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={`
            w-full
            px-[var(--spacing-3)] py-[var(--spacing-2)]
            bg-[var(--color-bg-secondary)]
            border border-transparent
            rounded-[var(--radius-md)]
            text-[var(--font-size-sm)] text-[var(--color-text-primary)]
            placeholder:text-[var(--color-text-muted)]
            resize-none
            transition-all duration-[var(--transition-fast)]
            focus:outline-none focus:bg-[var(--color-bg-primary)]
            focus:border-[var(--color-border-focus)]
            focus:ring-1 focus:ring-[var(--color-border-focus)]
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-[var(--color-accent-red)] bg-[var(--color-accent-red-light)]' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-[var(--spacing-1)] text-[var(--font-size-xs)] text-[var(--color-accent-red)]">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-[var(--spacing-1)] text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
