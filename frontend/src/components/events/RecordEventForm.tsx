import { useState, useEffect, useRef } from 'react';
import { useChainId } from 'wagmi';
import { Modal, Button, Textarea } from '@/components/common';
import { useRecordEvent } from '@/hooks';
import { useToast } from '@/hooks/useToast';
import { hashMetadata, EVENT_TYPE_LABELS } from '@/lib';

interface RecordEventFormContentProps {
  assetId: bigint;
  onClose: () => void;
  onSuccess?: () => void;
}

function RecordEventFormContent({ assetId, onClose, onSuccess }: RecordEventFormContentProps) {
  const chainId = useChainId();
  const toast = useToast();

  const [eventType, setEventType] = useState<number>(0);
  const [data, setData] = useState('');
  const [error, setError] = useState<string>();

  const { recordEvent, isPending, isConfirming, isSuccess, error: txError } = useRecordEvent(chainId);

  // Track if we've already handled success/error
  const handledSuccess = useRef(false);
  const handledError = useRef<Error | null>(null);

  // Handle success
  useEffect(() => {
    if (isSuccess && !handledSuccess.current) {
      handledSuccess.current = true;
      toast.success('Event recorded successfully!');
      onSuccess?.();
    }
  }, [isSuccess, toast, onSuccess]);

  // Handle error
  useEffect(() => {
    if (txError && handledError.current !== txError) {
      handledError.current = txError;
      toast.error(txError.message || 'Failed to record event');
    }
  }, [txError, toast]);

  const validate = (): boolean => {
    if (!data.trim()) {
      setError('Event data is required');
      return false;
    }
    setError(undefined);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const dataHash = hashMetadata(data);
      recordEvent(assetId, eventType, dataHash);
    } catch {
      toast.error('Failed to process event data');
    }
  };

  const isLoading = isPending || isConfirming;

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
        label="Event Data"
        placeholder={`{
  "description": "Annual maintenance performed",
  "technician": "John Doe",
  "date": "2024-01-15",
  "notes": "All components checked and verified"
}`}
        value={data}
        onChange={(e) => setData(e.target.value)}
        error={error}
        helperText="JSON data describing the event (will be hashed on-chain)"
        rows={6}
        disabled={isLoading}
      />

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
          {isPending ? 'Confirm...' : isConfirming ? 'Recording...' : 'Record Event'}
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
