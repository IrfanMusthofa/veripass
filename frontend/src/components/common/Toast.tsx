import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toastVariants } from '@/lib/animations';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const typeStyles: Record<ToastType, { bg: string; icon: string }> = {
  success: {
    bg: 'bg-[var(--color-accent-green-light)] border-[var(--color-accent-green)]',
    icon: 'text-[var(--color-accent-green)]',
  },
  error: {
    bg: 'bg-[var(--color-accent-red-light)] border-[var(--color-accent-red)]',
    icon: 'text-[var(--color-accent-red)]',
  },
  info: {
    bg: 'bg-[rgba(35,131,226,0.1)] border-[var(--color-accent-blue)]',
    icon: 'text-[var(--color-accent-blue)]',
  },
  warning: {
    bg: 'bg-[var(--color-accent-yellow-light)] border-[var(--color-accent-orange)]',
    icon: 'text-[var(--color-accent-orange)]',
  },
};

const icons: Record<ToastType, ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const { id, type, message, duration = 5000 } = toast;
  const styles = typeStyles[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <motion.div
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`
        flex items-center gap-3
        px-[var(--spacing-4)] py-[var(--spacing-3)]
        rounded-[var(--radius-lg)]
        border-l-4
        shadow-[var(--shadow-md)]
        bg-[var(--color-bg-primary)]
        ${styles.bg}
      `}
    >
      <span className={styles.icon}>{icons[type]}</span>
      <p className="text-[var(--font-size-sm)] text-[var(--color-text-primary)] flex-1">
        {message}
      </p>
      <button
        onClick={() => onDismiss(id)}
        className="
          text-[var(--color-text-muted)]
          hover:text-[var(--color-text-primary)]
          transition-colors duration-[var(--transition-fast)]
        "
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-[var(--spacing-4)] right-[var(--spacing-4)] z-[var(--z-toast)] flex flex-col gap-[var(--spacing-2)]">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
