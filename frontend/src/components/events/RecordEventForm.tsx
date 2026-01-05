import { useState, useEffect, useRef } from 'react';
import { useChainId, useWaitForTransactionReceipt } from 'wagmi';
import { Modal, Button, Textarea } from '@/components/common';
import { useRecordEvent } from '@/hooks';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import { EVENT_TYPE_LABELS } from '@/lib';
import type { EventType, EvidenceResponse } from '@/types/api';

interface RecordEventFormContentProps {
  assetId: bigint;
  onClose: () => void;
  onSuccess?: () => void;
}

// Map numeric event type to string
const EVENT_TYPE_MAP: Record<number, EventType> = {
  0: 'MAINTENANCE',
  1: 'VERIFICATION',
  2: 'WARRANTY',
  3: 'CERTIFICATION',
  4: 'CUSTOM',
};

function RecordEventFormContent({ assetId, onClose, onSuccess }: RecordEventFormContentProps) {
  const chainId = useChainId();
  const toast = useToast();

  const [eventType, setEventType] = useState<number>(0);
  const [data, setData] = useState('');
  const [error, setError] = useState<string>();
  const [isCreatingEvidence, setIsCreatingEvidence] = useState(false);
  const [pendingEvidence, setPendingEvidence] = useState<EvidenceResponse | null>(null);

  const { recordEvent, hash, isPending, isConfirming, isSuccess, error: txError } = useRecordEvent(chainId);

  // Wait for transaction receipt
  useWaitForTransactionReceipt({
    hash,
  });

  // Track if we've already handled success/error
  const handledSuccess = useRef(false);
  const handledError = useRef<Error | null>(null);

  // Handle blockchain success -> confirm evidence
  useEffect(() => {
    async function confirmEvidence() {
      if (isSuccess && pendingEvidence && hash && !handledSuccess.current) {
        handledSuccess.current = true;
        try {
          await api.confirmEvidence(pendingEvidence.id, {
            txHash: hash,
            // blockchainEventId could be extracted from receipt logs if needed
          });
          toast.success('Event recorded successfully!');
          onSuccess?.();
        } catch (err) {
          console.error('Failed to confirm evidence:', err);
          toast.error('Event recorded on blockchain but failed to confirm in database');
          onSuccess?.(); // Still call success since blockchain tx worked
        }
      }
    }
    confirmEvidence();
  }, [isSuccess, pendingEvidence, hash, toast, onSuccess]);

  // Handle blockchain error
  useEffect(() => {
    if (txError && handledError.current !== txError) {
      handledError.current = txError;
      toast.error(txError.message || 'Failed to record event on blockchain');
      // Reset pending evidence so user can retry
      setPendingEvidence(null);
    }
  }, [txError, toast]);

  const validate = (): boolean => {
    if (!data.trim()) {
      setError('Event data is required');
      return false;
    }
    // Try to parse as JSON
    try {
      JSON.parse(data);
    } catch {
      setError('Please enter valid JSON data');
      return false;
    }
    setError(undefined);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Reset refs for new submission
    handledSuccess.current = false;
    handledError.current = null;

    try {
      setIsCreatingEvidence(true);

      // Parse the JSON data
      const eventData = JSON.parse(data);

      // Step 1: Create evidence in backend
      const response = await api.createEvidence({
        assetId: Number(assetId),
        eventType: EVENT_TYPE_MAP[eventType],
        description: eventData.description || undefined,
        eventData,
      });

      setPendingEvidence(response.data);
      const dataHash = response.data.dataHash as `0x${string}`;

      // Step 2: Record on blockchain
      recordEvent(assetId, eventType, dataHash);
    } catch (err) {
      console.error('Failed to create evidence:', err);
      toast.error('Failed to save event data');
    } finally {
      setIsCreatingEvidence(false);
    }
  };

  const isLoading = isCreatingEvidence || isPending || isConfirming;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Asset ID</span>
          <span className="font-medium">#{assetId.toString()}</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Event Type
        </label>
        <select
          value={eventType}
          onChange={(e) => setEventType(Number(e.target.value))}
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        >
          {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          {eventType === 0 && 'Service, repair, or inspection records'}
          {eventType === 1 && 'Authenticity verification checks'}
          {eventType === 2 && 'Warranty claims, extensions, or transfers'}
          {eventType === 3 && 'Third-party certifications'}
          {eventType === 4 && 'Application-specific events'}
        </p>
      </div>

      <Textarea
        label="Event Data (JSON)"
        placeholder={`{
  "description": "Annual maintenance performed",
  "technician": "John Doe",
  "date": "2024-01-15",
  "notes": "All components checked and verified"
}`}
        value={data}
        onChange={(e) => setData(e.target.value)}
        error={error}
        helperText="Enter event details as JSON. This data will be stored off-chain and its hash will be recorded on the blockchain."
        rows={6}
        disabled={isLoading}
      />

      {pendingEvidence && (
        <div className="bg-blue-50 rounded-lg p-3 text-sm">
          <p className="text-blue-700">
            ✓ Evidence created (Hash: {pendingEvidence.dataHash.slice(0, 10)}...)
          </p>
          <p className="text-blue-600 mt-1">
            Waiting for blockchain confirmation...
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={isLoading}
          className="flex-1"
        >
          {isCreatingEvidence
            ? 'Saving...'
            : isPending
              ? 'Confirm in wallet...'
              : isConfirming
                ? 'Recording...'
                : 'Record Event'}
        </Button>
      </div>
    </form>
  );
}

interface RecordEventFormProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: bigint;
  onSuccess?: () => void;
}

export function RecordEventForm({
  isOpen,
  onClose,
  assetId,
  onSuccess,
}: RecordEventFormProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Event"
      size="md"
    >
      {isOpen && (
        <RecordEventFormContent
          assetId={assetId}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    </Modal>
  );
}
