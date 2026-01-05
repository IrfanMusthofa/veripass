import { useMemo, useState } from 'react';
import { useChainId } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardBody, CardHeader, Button } from '@/components/common';
import { Skeleton } from '@/components/design-system';
import { EventCard } from './EventCard';
import { EventTypeFilter } from './EventTypeFilter';
import { useAssetEvents, useEvidenceByAsset, useIsBackendAvailable } from '@/hooks';
import type { LifecycleEvent } from '@/types';
import type { EvidenceResponse } from '@/types/api';

interface EventTimelineProps {
  assetId: bigint;
  showRecordButton?: boolean;
  onRecordClick?: () => void;
}

interface EnrichedEvent extends LifecycleEvent {
  evidence?: EvidenceResponse;
}

// Helper function to get event type color
const getEventTypeColor = (eventType: number): string => {
  switch (eventType) {
    case 0: return 'bg-blue-500';
    case 1: return 'bg-green-500';
    case 2: return 'bg-orange-500';
    case 3: return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
};

export function EventTimeline({ assetId, showRecordButton, onRecordClick }: EventTimelineProps) {
  const chainId = useChainId();
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const { isAvailable: isBackendAvailable } = useIsBackendAvailable();

  const { data: rawEvents, isLoading: isLoadingEvents, error } = useAssetEvents(assetId, chainId);
  const { data: evidenceData, isLoading: isLoadingEvidence } = useEvidenceByAsset(
    Number(assetId),
    isBackendAvailable
  );

  const events: LifecycleEvent[] = useMemo(() => {
    if (!rawEvents || !Array.isArray(rawEvents) || rawEvents.length === 0) return [];

    try {
      const parsed = rawEvents.map((raw: unknown) => {
        if (Array.isArray(raw)) {
          return {
            id: raw[0] as bigint,
            assetId: raw[1] as bigint,
            eventType: Number(raw[2]),
            submitter: raw[3] as `0x${string}`,
            timestamp: raw[4] as bigint,
            dataHash: raw[5] as `0x${string}`,
          };
        }

        const obj = raw as Record<string, unknown>;
        return {
          id: obj.id as bigint,
          assetId: obj.assetId as bigint,
          eventType: Number(obj.eventType),
          submitter: obj.submitter as `0x${string}`,
          timestamp: obj.timestamp as bigint,
          dataHash: obj.dataHash as `0x${string}`,
        };
      });

      return parsed.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    } catch {
      return [];
    }
  }, [rawEvents]);

  const evidenceMap = useMemo(() => {
    const map = new Map<string, EvidenceResponse>();
    if (evidenceData?.data) {
      evidenceData.data.forEach((ev) => {
        map.set(ev.dataHash.toLowerCase(), ev);
      });
    }
    return map;
  }, [evidenceData]);

  const enrichedEvents: EnrichedEvent[] = useMemo(() => {
    return events.map((event) => ({
      ...event,
      evidence: event.dataHash ? evidenceMap.get(event.dataHash.toLowerCase()) : undefined,
    }));
  }, [events, evidenceMap]);

  // Apply type filter if selected
  const filteredEvents = useMemo(() => {
    if (selectedType === null) return enrichedEvents;
    return enrichedEvents.filter((e) => e.eventType === selectedType);
  }, [enrichedEvents, selectedType]);

  const isLoading = isLoadingEvents || (isBackendAvailable && isLoadingEvidence);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-[var(--font-size-lg)] font-semibold text-[var(--color-text-primary)]">
            Lifecycle Events
            {filteredEvents.length > 0 && (
              <span className="ml-2 text-[var(--font-size-sm)] font-normal text-[var(--color-text-muted)]">
                ({filteredEvents.length})
              </span>
            )}
          </h3>

          {showRecordButton && (
            <Button variant="ghost" size="sm" onClick={onRecordClick}>
              + Record Event
            </Button>
          )}
        </div>
      </CardHeader>

      <CardBody>
        {filteredEvents.length > 0 && (
          <div className="mb-[var(--spacing-4)]">
            <EventTypeFilter selectedType={selectedType} onSelect={setSelectedType} />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-[var(--color-accent-red)]">Failed to load events.</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[var(--color-text-muted)]">
              {events.length === 0 ? 'No events recorded for this asset yet.' : 'No events match the selected filter.'}
            </p>
          </div>
        ) : (
          <div className="mt-[var(--spacing-4)]">
            <AnimatePresence mode="popLayout">
              {filteredEvents.map((event, index) => (
                <motion.div
                  key={event.dataHash}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    layout: { duration: 0.3 }
                  }}
                >
                  <EnrichedEventCard
                    event={event}
                    isLast={index === filteredEvents.length - 1}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function EnrichedEventCard({ event, isLast }: { event: EnrichedEvent; isLast: boolean }) {
  const evidence = event.evidence;
  const dotColor = getEventTypeColor(event.eventType);

  return (
    <div className={`relative pl-8 ${evidence ? 'pb-8' : 'pb-6'} last:pb-0`}>
      {/* Colored vertical timeline line connecting events */}
      {!isLast && (
        <motion.div
          className={`absolute left-[11px] top-8 bottom-0 w-0.5 ${dotColor}`}
          initial={{ scaleY: 0, originY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        />
      )}

      {/* Colored timeline dot with verification checkmark */}
      <motion.div
        className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ${dotColor} shadow-md`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.1
        }}
      >
        {evidence?.isVerified && (
          <motion.svg
            className="w-3.5 h-3.5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <motion.path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </motion.svg>
        )}
      </motion.div>

      {/* White event card */}
      <div className={evidence ? 'mb-0' : ''}>
        <EventCard event={event} />
      </div>

      {/* Grey supplementary information box - visually grouped with white box */}
      {evidence && (
        <motion.div
          className="mt-3 p-4 bg-[var(--color-bg-secondary)] rounded-[var(--radius-md)] border-l-2 border-transparent hover:border-[var(--color-border-hover)] transition-colors duration-200"
          style={{
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {/* Header with badges */}
          <div className="flex items-center gap-2 mb-3">
            {evidence.isVerified && (
              <motion.span
                className="inline-flex items-center gap-1 text-[var(--font-size-xs)] px-2.5 py-1 rounded-full bg-[var(--color-accent-green-light)] text-[var(--color-accent-green)] font-medium"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.3 }}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </motion.span>
            )}
            {evidence.providerName && (
              <span className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] font-medium">
                by {evidence.providerName}
              </span>
            )}
          </div>

          {/* Description */}
          {evidence.description && (
            <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] leading-relaxed mb-2">
              {evidence.description}
            </p>
          )}

          {/* Transaction hash */}
          {evidence.txHash && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <span className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">Transaction:</span>
                <code className="text-[var(--font-size-xs)] font-mono text-[var(--color-text-secondary)] bg-white px-2 py-1 rounded">
                  {evidence.txHash.slice(0, 10)}...{evidence.txHash.slice(-8)}
                </code>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
