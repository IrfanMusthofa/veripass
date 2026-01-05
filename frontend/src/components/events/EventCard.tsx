import { Badge } from '@/components/common';
import { truncateAddress, truncateHash, formatTimestamp, getEventTypeLabel, EVENT_TYPE_VARIANTS } from '@/lib';
import type { LifecycleEvent } from '@/types';

interface EventCardProps {
  event: LifecycleEvent;
  isLast?: boolean;
}

export function EventCard({ event, isLast = false }: EventCardProps) {
  const variant = EVENT_TYPE_VARIANTS[event.eventType] || 'default';

  return (
    <div className="relative pl-8 pb-6">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-200" />
      )}

      {/* Timeline dot */}
      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
        <div className={`w-2.5 h-2.5 rounded-full ${event.eventType === 0 ? 'bg-blue-500' :
            event.eventType === 1 ? 'bg-green-500' :
              event.eventType === 2 ? 'bg-orange-500' :
                event.eventType === 3 ? 'bg-purple-500' :
                  'bg-gray-500'
          }`} />
      </div>

      {/* Event content */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-start justify-between mb-2">
          <Badge variant={variant} size="sm">
            {getEventTypeLabel(event.eventType)}
          </Badge>
          <span className="text-xs text-gray-500">
            {formatTimestamp(Number(event.timestamp))}
          </span>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Event ID</span>
            <span className="font-mono text-gray-700">#{event.id?.toString()}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Submitter</span>
            <span className="font-mono text-gray-700">
              {truncateAddress(event.submitter)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Data Hash</span>
            <span className="font-mono text-gray-700">
              {truncateHash(event.dataHash)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
