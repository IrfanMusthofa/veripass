import { motion } from 'framer-motion';
import { Badge } from '@/components/common';
import { truncateAddress, truncateHash, formatTimestamp, getEventTypeLabel, EVENT_TYPE_VARIANTS } from '@/lib';
import type { LifecycleEvent } from '@/types';

interface EventCardProps {
  event: LifecycleEvent;
}

export function EventCard({ event }: EventCardProps) {
  const variant = EVENT_TYPE_VARIANTS[event.eventType] || 'default';

  return (
    <div className="relative">
      {/* Event content with smooth animation */}
      <motion.div
        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <div className="flex items-start justify-between mb-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Badge variant={variant} size="sm">
              {getEventTypeLabel(event.eventType)}
            </Badge>
          </motion.div>
          <motion.span
            className="text-xs text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            {formatTimestamp(Number(event.timestamp))}
          </motion.span>
        </div>

        <motion.div
          className="space-y-2 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Event ID</span>
            <span className="font-mono text-gray-700 font-medium">#{event.id?.toString()}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-500">Submitter</span>
            <span className="font-mono text-gray-700">
              {truncateAddress(event.submitter)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-500">Data Hash</span>
            <span className="font-mono text-gray-700 text-xs">
              {truncateHash(event.dataHash)}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
