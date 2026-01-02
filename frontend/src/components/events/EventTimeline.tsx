import { useState, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { Card, CardBody, CardHeader, LoadingOverlay } from '@/components/common';
import { EventCard } from './EventCard';
import { EventTypeFilter } from './EventTypeFilter';
import { useAssetEvents, parseLifecycleEvents } from '@/hooks';
import type { LifecycleEvent } from '@/types';

interface EventTimelineProps {
  assetId: bigint;
  showRecordButton?: boolean;
  onRecordClick?: () => void;
}

export function EventTimeline({ assetId, showRecordButton, onRecordClick }: EventTimelineProps) {
  const chainId = useChainId();
  const [selectedType, setSelectedType] = useState<number | null>(null);

  const { data: rawEvents, isLoading, error } = useAssetEvents(assetId, chainId);

  const events: LifecycleEvent[] = useMemo(() => {
    if (!rawEvents) return [];
    try {
      // Parse the raw contract data
      const parsed = parseLifecycleEvents(rawEvents as readonly (readonly [bigint, bigint, number, `0x${string}`, bigint, `0x${string}`])[]);
      // Sort by timestamp descending (newest first)
      return parsed.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    } catch {
      return [];
    }
  }, [rawEvents]);

  const filteredEvents = useMemo(() => {
    if (selectedType === null) return events;
    return events.filter((e) => e.eventType === selectedType);
  }, [events, selectedType]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Lifecycle Events
            {events.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({events.length})
              </span>
            )}
          </h3>
          {showRecordButton && (
            <button
              onClick={onRecordClick}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Record Event
            </button>
          )}
        </div>
      </CardHeader>

      <CardBody>
        {/* Filter */}
        {events.length > 0 && (
          <div className="mb-4">
            <EventTypeFilter
              selectedType={selectedType}
              onSelect={setSelectedType}
            />
          </div>
        )}

        {/* Events */}
        {isLoading ? (
          <LoadingOverlay message="Loading events..." />
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            Failed to load events.
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {events.length === 0
              ? 'No events recorded for this asset yet.'
              : 'No events match the selected filter.'}
          </div>
        ) : (
          <div className="mt-4">
            {filteredEvents.map((event, index) => (
              <EventCard
                key={event.id.toString()}
                event={event}
                isLast={index === filteredEvents.length - 1}
              />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
