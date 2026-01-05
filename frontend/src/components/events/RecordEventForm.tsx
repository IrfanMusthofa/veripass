import { useState, useEffect, useRef, useCallback } from 'react';
import { useChainId, useWaitForTransactionReceipt } from 'wagmi';
import { Modal, Button, Input, Textarea } from '@/components/common';
import { useRecordEvent } from '@/hooks';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';

interface RecordEventFormContentProps {
  assetId: bigint;
  onClose: () => void;
  onSuccess?: () => void;
}

// localStorage key for pending evidence creation
const PENDING_EVIDENCE_KEY = 'veripass_pending_evidence';

interface PendingEvidence {
  assetId: number;
  dataHash: string;
  txHash: string;
  blockchainEventId?: number;
  description: string;
  eventDate?: string;
  providerName?: string;
  notes?: string;
  eventData?: Record<string, unknown>;
  timestamp: number;
}

// Form data interface - only fields relevant for custom events
interface CustomEventFormData {
  description: string;
  eventDate: string;
  providerName: string;
  notes: string;
  customData: string;
}

interface FormErrors {
  description?: string;
  customData?: string;
}

const getInitialFormData = (): CustomEventFormData => ({
  description: '',
  eventDate: '',
  providerName: '',
  notes: '',
  customData: '',
});

// Save pending evidence to localStorage for retry
function savePendingEvidence(data: PendingEvidence): void {
  const existing = getPendingEvidences();
  existing.push(data);
  localStorage.setItem(PENDING_EVIDENCE_KEY, JSON.stringify(existing));
}

// Get all pending evidences from localStorage
function getPendingEvidences(): PendingEvidence[] {
  try {
    const stored = localStorage.getItem(PENDING_EVIDENCE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Remove a pending evidence from localStorage
function removePendingEvidence(dataHash: string): void {
  const existing = getPendingEvidences();
  const filtered = existing.filter(e => e.dataHash !== dataHash);
  localStorage.setItem(PENDING_EVIDENCE_KEY, JSON.stringify(filtered));
}

function RecordEventFormContent({ assetId, onClose, onSuccess }: RecordEventFormContentProps) {
  const chainId = useChainId();
  const toast = useToast();

  const [formData, setFormData] = useState<CustomEventFormData>(getInitialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isCalculatingHash, setIsCalculatingHash] = useState(false);
  const [currentHash, setCurrentHash] = useState<string | null>(null);
  const [pendingTxData, setPendingTxData] = useState<{
    dataHash: string;
    description: string;
    eventDate?: string;
    providerName?: string;
    notes?: string;
    eventData?: Record<string, unknown>;
  } | null>(null);

  const { recordEvent, hash, isPending, isConfirming, isSuccess, error: txError } = useRecordEvent(chainId);

  // Wait for transaction receipt to get blockchainEventId
  const { data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  // Track if we've already handled success/error
  const handledSuccess = useRef(false);
  const handledError = useRef<Error | null>(null);

  // Update form field helper
  const updateField = (field: keyof CustomEventFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Retry pending evidence creation from localStorage
  const retryPendingEvidences = useCallback(async () => {
    const pending = getPendingEvidences();
    for (const evidence of pending) {
      // Only retry if less than 1 hour old
      if (Date.now() - evidence.timestamp > 60 * 60 * 1000) {
        removePendingEvidence(evidence.dataHash);
        continue;
      }

      try {
        await api.createEvidence({
          assetId: evidence.assetId,
          eventType: 'CUSTOM',
          description: evidence.description,
          eventDate: evidence.eventDate,
          providerName: evidence.providerName,
          notes: evidence.notes,
          eventData: evidence.eventData,
          txHash: evidence.txHash,
          blockchainEventId: evidence.blockchainEventId,
        });
        removePendingEvidence(evidence.dataHash);
        console.log('Retried pending evidence successfully:', evidence.dataHash);
      } catch (err) {
        console.error('Failed to retry pending evidence:', err);
      }
    }
  }, []);

  // Retry pending evidences on mount
  useEffect(() => {
    retryPendingEvidences();
  }, [retryPendingEvidences]);

  // Handle blockchain success -> create evidence in DB
  useEffect(() => {
    async function createEvidence() {
      if (isSuccess && pendingTxData && hash && !handledSuccess.current) {
        handledSuccess.current = true;

        // Extract blockchainEventId from receipt logs if available
        let blockchainEventId: number | undefined;
        if (receipt?.logs) {
          // The EventRecorded event has eventId as first indexed topic
          // Topic 0 is event signature, Topic 1 is eventId
          const eventLog = receipt.logs.find(log => log.topics.length >= 2);
          if (eventLog && eventLog.topics[1]) {
            blockchainEventId = parseInt(eventLog.topics[1], 16);
          }
        }

        try {
          // Step 3: Create evidence as CONFIRMED in database
          await api.createEvidence({
            assetId: Number(assetId),
            eventType: 'CUSTOM',
            description: pendingTxData.description,
            eventDate: pendingTxData.eventDate,
            providerName: pendingTxData.providerName,
            notes: pendingTxData.notes,
            eventData: pendingTxData.eventData,
            txHash: hash,
            blockchainEventId,
          });

          toast.success('Custom event recorded successfully!');
          onSuccess?.();
        } catch (err) {
          console.error('Failed to create evidence in database:', err);

          // Save to localStorage for retry
          savePendingEvidence({
            assetId: Number(assetId),
            dataHash: pendingTxData.dataHash,
            txHash: hash,
            blockchainEventId,
            description: pendingTxData.description,
            eventDate: pendingTxData.eventDate,
            providerName: pendingTxData.providerName,
            notes: pendingTxData.notes,
            eventData: pendingTxData.eventData,
            timestamp: Date.now(),
          });

          toast.error('Event recorded on blockchain but failed to save to database. Will retry automatically.');
          onSuccess?.(); // Still call success since blockchain tx worked
        }
      }
    }
    createEvidence();
  }, [isSuccess, pendingTxData, hash, receipt, assetId, toast, onSuccess]);

  // Handle blockchain error
  useEffect(() => {
    if (txError && handledError.current !== txError) {
      handledError.current = txError;
      toast.error(txError.message || 'Failed to record event on blockchain');
      // Reset state so user can retry
      setPendingTxData(null);
      setCurrentHash(null);
    }
  }, [txError, toast]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    // Validate JSON if provided
    if (formData.customData.trim()) {
      try {
        JSON.parse(formData.customData);
      } catch {
        newErrors.customData = 'Please enter valid JSON data';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Build eventData object
  const buildEventData = (): Record<string, unknown> | undefined => {
    if (!formData.customData.trim()) {
      return undefined;
    }

    try {
      return JSON.parse(formData.customData);
    } catch {
      return undefined;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Reset refs for new submission
    handledSuccess.current = false;
    handledError.current = null;

    try {
      setIsCalculatingHash(true);

      const eventData = buildEventData();

      // Step 1: Calculate hash (no DB write)
      const hashResponse = await api.calculateEvidenceHash({
        assetId: Number(assetId),
        eventType: 'CUSTOM',
        eventDate: formData.eventDate || undefined,
        providerName: formData.providerName || undefined,
        description: formData.description,
        notes: formData.notes || undefined,
        eventData,
      });

      const dataHash = hashResponse.data.dataHash as `0x${string}`;
      setCurrentHash(dataHash);

      // Save data for Step 3 after blockchain confirmation
      setPendingTxData({
        dataHash,
        description: formData.description,
        eventDate: formData.eventDate || undefined,
        providerName: formData.providerName || undefined,
        notes: formData.notes || undefined,
        eventData,
      });

      setIsCalculatingHash(false);

      // Step 2: Record on blockchain (eventType 4 = CUSTOM)
      recordEvent(assetId, 4, dataHash);
    } catch (err) {
      console.error('Failed to calculate hash:', err);
      toast.error('Failed to prepare event data');
      setIsCalculatingHash(false);
    }
  };

  const isLoading = isCalculatingHash || isPending || isConfirming;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Warning banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">Custom Event - Not Verified</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Custom events are recorded directly by users and are not verified by service providers.
              For verified events, please use an authorized service provider.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Asset ID</span>
          <span className="font-medium">#{assetId.toString()}</span>
        </div>
      </div>

      {/* Description - required */}
      <Input
        label="Description"
        placeholder="Brief description of the event"
        value={formData.description}
        onChange={(e) => updateField('description', e.target.value)}
        error={errors.description}
        disabled={isLoading}
      />

      {/* Optional fields in a grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Event Date (Optional)"
          type="date"
          value={formData.eventDate}
          onChange={(e) => updateField('eventDate', e.target.value)}
          disabled={isLoading}
        />
        <Input
          label="Source/Provider Name (Optional)"
          placeholder="e.g., Owner, Third Party"
          value={formData.providerName}
          onChange={(e) => updateField('providerName', e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* Notes */}
      <Textarea
        label="Notes (Optional)"
        placeholder="Any additional notes or comments..."
        value={formData.notes}
        onChange={(e) => updateField('notes', e.target.value)}
        rows={2}
        disabled={isLoading}
      />

      {/* Custom JSON data */}
      <Textarea
        label="Additional Data (Optional, JSON)"
        placeholder={`{
  "customField1": "value1",
  "customField2": "value2"
}`}
        value={formData.customData}
        onChange={(e) => updateField('customData', e.target.value)}
        error={errors.customData}
        helperText="Enter additional structured data as JSON"
        rows={4}
        disabled={isLoading}
      />

      {/* Progress indicator */}
      {currentHash && (
        <div className="bg-blue-50 rounded-lg p-3 text-sm">
          <p className="text-blue-700">
            Hash calculated: {currentHash.slice(0, 18)}...
          </p>
          {isPending && (
            <p className="text-blue-600 mt-1">Please confirm in your wallet...</p>
          )}
          {isConfirming && (
            <p className="text-blue-600 mt-1">Waiting for blockchain confirmation...</p>
          )}
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
          {isCalculatingHash
            ? 'Preparing...'
            : isPending
              ? 'Confirm in wallet...'
              : isConfirming
                ? 'Recording...'
                : 'Record Custom Event'}
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
      title="Add Custom Event"
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
