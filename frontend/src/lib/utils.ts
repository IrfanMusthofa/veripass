/**
 * Event type labels for display
 */
export const EVENT_TYPE_LABELS: Record<number, string> = {
  0: 'Maintenance',
  1: 'Verification',
  2: 'Warranty',
  3: 'Certification',
  4: 'Custom',
};

/**
 * Event type Tailwind color classes
 */
export const EVENT_TYPE_COLORS: Record<number, string> = {
  0: 'bg-blue-100 text-blue-800',      // Maintenance - blue
  1: 'bg-green-100 text-green-800',    // Verification - green
  2: 'bg-orange-100 text-orange-800',  // Warranty - orange
  3: 'bg-purple-100 text-purple-800',  // Certification - purple
  4: 'bg-gray-100 text-gray-800',      // Custom - gray
};

/**
 * Event type badge variants
 */
export const EVENT_TYPE_VARIANTS: Record<number, 'info' | 'success' | 'warning' | 'default'> = {
  0: 'info',      // Maintenance
  1: 'success',   // Verification
  2: 'warning',   // Warranty
  3: 'info',      // Certification
  4: 'default',   // Custom
};

/**
 * Get event type label
 */
export function getEventTypeLabel(eventType: number): string {
  return EVENT_TYPE_LABELS[eventType] || 'Unknown';
}

/**
 * Get event type color classes
 */
export function getEventTypeColor(eventType: number): string {
  return EVENT_TYPE_COLORS[eventType] || EVENT_TYPE_COLORS[4];
}

/**
 * Combine class names, filtering out falsy values
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
