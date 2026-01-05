import { useState, useEffect, useRef } from 'react';
import { useChainId, useWaitForTransactionReceipt } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, Button, Input, Textarea } from '@/components/common';
import { useRecordEvent } from '@/hooks';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import { EVENT_TYPE_LABELS } from '@/lib';
import { fadeVariants } from '@/lib/animations';
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

// Service type options for maintenance events
const SERVICE_TYPES = ['Inspection', 'Repair', 'Service', 'Replacement', 'Other'] as const;

// Verification result options
const VERIFICATION_RESULTS = ['Passed', 'Failed', 'Pending'] as const;

// Warranty type options
const WARRANTY_TYPES = ['Claim', 'Extension', 'Transfer'] as const;

// Form data interfaces
interface EventFormData {
  // Common fields
  description: string;
  eventDate: string;
  notes: string;
  // Maintenance fields
  technician: string;
  serviceType: string;
  workPerformed: string;
  // Verification fields
  verifierName: string;
  verificationMethod: string;
  result: string;
  // Warranty fields
  providerName: string;
  warrantyType: string;
  warrantyExpiry: string;
  claimDetails: string;
  // Certification fields
  certifyingBody: string;
  certificateNumber: string;
  expiryDate: string;
  certificationType: string;
  // Custom fields
  customData: string;
}

interface FormErrors {
  description?: string;
  eventDate?: string;
  technician?: string;
  serviceType?: string;
  verifierName?: string;
  result?: string;
  providerName?: string;
  warrantyType?: string;
  certifyingBody?: string;
  certificateNumber?: string;
  customData?: string;
}

const getInitialFormData = (): EventFormData => ({
  description: '',
  eventDate: '',
  notes: '',
  technician: '',
  serviceType: '',
  workPerformed: '',
  verifierName: '',
  verificationMethod: '',
  result: '',
  providerName: '',
  warrantyType: '',
  warrantyExpiry: '',
  claimDetails: '',
  certifyingBody: '',
  certificateNumber: '',
  expiryDate: '',
  certificationType: '',
  customData: '',
});

function RecordEventFormContent({ assetId, onClose, onSuccess }: RecordEventFormContentProps) {
  const chainId = useChainId();
  const toast = useToast();

  const [eventType, setEventType] = useState<number>(0);
  const [formData, setFormData] = useState<EventFormData>(getInitialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isCreatingEvidence, setIsCreatingEvidence] = useState(false);
  const [pendingEvidence, setPendingEvidence] = useState<EvidenceResponse | null>(null);

  // Reset type-specific fields when event type changes
  const handleEventTypeChange = (newType: number) => {
    setEventType(newType);
    setErrors({});
  };

  // Update form field helper
  const updateField = (field: keyof EventFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

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
    const newErrors: FormErrors = {};

    // Description is required for all types
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    // Type-specific validation
    switch (eventType) {
      case 0: // MAINTENANCE
        if (!formData.technician.trim()) {
          newErrors.technician = 'Technician name is required';
        }
        if (!formData.serviceType) {
          newErrors.serviceType = 'Service type is required';
        }
        break;
      case 1: // VERIFICATION
        if (!formData.verifierName.trim()) {
          newErrors.verifierName = 'Verifier name is required';
        }
        if (!formData.result) {
          newErrors.result = 'Verification result is required';
        }
        break;
      case 2: // WARRANTY
        if (!formData.providerName.trim()) {
          newErrors.providerName = 'Provider name is required';
        }
        if (!formData.warrantyType) {
          newErrors.warrantyType = 'Warranty type is required';
        }
        break;
      case 3: // CERTIFICATION
        if (!formData.certifyingBody.trim()) {
          newErrors.certifyingBody = 'Certifying body is required';
        }
        if (!formData.certificateNumber.trim()) {
          newErrors.certificateNumber = 'Certificate number is required';
        }
        break;
      case 4: // CUSTOM
        // Validate JSON if provided
        if (formData.customData.trim()) {
          try {
            JSON.parse(formData.customData);
          } catch {
            newErrors.customData = 'Please enter valid JSON data';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Build eventData object based on event type
  const buildEventData = (): Record<string, unknown> => {
    const baseData: Record<string, unknown> = {
      description: formData.description,
    };

    if (formData.eventDate) {
      baseData.date = formData.eventDate;
    }
    if (formData.notes.trim()) {
      baseData.notes = formData.notes;
    }

    switch (eventType) {
      case 0: // MAINTENANCE
        return {
          ...baseData,
          technician: formData.technician,
          serviceType: formData.serviceType,
          workPerformed: formData.workPerformed.trim()
            ? formData.workPerformed.split('\n').filter(Boolean)
            : [],
        };
      case 1: // VERIFICATION
        return {
          ...baseData,
          verifierName: formData.verifierName,
          verificationMethod: formData.verificationMethod || undefined,
          result: formData.result,
        };
      case 2: // WARRANTY
        return {
          ...baseData,
          providerName: formData.providerName,
          warrantyType: formData.warrantyType,
          warrantyExpiry: formData.warrantyExpiry || undefined,
          claimDetails: formData.claimDetails || undefined,
        };
      case 3: // CERTIFICATION
        return {
          ...baseData,
          certifyingBody: formData.certifyingBody,
          certificateNumber: formData.certificateNumber,
          expiryDate: formData.expiryDate || undefined,
          certificationType: formData.certificationType || undefined,
        };
      case 4: // CUSTOM
        if (formData.customData.trim()) {
          try {
            const customParsed = JSON.parse(formData.customData);
            return { ...baseData, ...customParsed };
          } catch {
            return baseData;
          }
        }
        return baseData;
      default:
        return baseData;
    }
  };

  // Get provider name based on event type
  const getProviderName = (): string | undefined => {
    switch (eventType) {
      case 0:
        return formData.technician || undefined;
      case 1:
        return formData.verifierName || undefined;
      case 2:
        return formData.providerName || undefined;
      case 3:
        return formData.certifyingBody || undefined;
      default:
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
      setIsCreatingEvidence(true);

      // Build the event data from form fields
      const eventData = buildEventData();

      // Step 1: Create evidence in backend
      const response = await api.createEvidence({
        assetId: Number(assetId),
        eventType: EVENT_TYPE_MAP[eventType],
        eventDate: formData.eventDate || undefined,
        providerName: getProviderName(),
        description: formData.description,
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
          onChange={(e) => handleEventTypeChange(Number(e.target.value))}
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

      {/* Common fields */}
      <Input
        label="Description"
        placeholder="Brief description of the event"
        value={formData.description}
        onChange={(e) => updateField('description', e.target.value)}
        error={errors.description}
        disabled={isLoading}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Event Date"
          type="date"
          value={formData.eventDate}
          onChange={(e) => updateField('eventDate', e.target.value)}
          error={errors.eventDate}
          disabled={isLoading}
        />
      </div>

      {/* Type-specific fields */}
      <AnimatePresence mode="wait">
        {/* MAINTENANCE fields */}
        {eventType === 0 && (
          <motion.div key="maintenance" {...fadeVariants} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Technician Name"
                placeholder="e.g., John Doe"
                value={formData.technician}
                onChange={(e) => updateField('technician', e.target.value)}
                error={errors.technician}
                disabled={isLoading}
              />
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-primary)] mb-[var(--spacing-1)]">
                  Service Type
                </label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => updateField('serviceType', e.target.value)}
                  disabled={isLoading}
                  className={`
                    w-full h-9 px-[var(--spacing-3)] py-[var(--spacing-2)]
                    bg-[var(--color-bg-secondary)] border border-transparent
                    rounded-[var(--radius-md)] text-[var(--font-size-sm)] text-[var(--color-text-primary)]
                    transition-all duration-[var(--transition-fast)]
                    focus:outline-none focus:bg-[var(--color-bg-primary)]
                    focus:border-[var(--color-border-focus)] focus:ring-1 focus:ring-[var(--color-border-focus)]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${errors.serviceType ? 'border-[var(--color-accent-red)] bg-[var(--color-accent-red-light)]' : ''}
                  `}
                >
                  <option value="">Select service type...</option>
                  {SERVICE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.serviceType && (
                  <p className="mt-[var(--spacing-1)] text-[var(--font-size-xs)] text-[var(--color-accent-red)]">
                    {errors.serviceType}
                  </p>
                )}
              </div>
            </div>
            <Textarea
              label="Work Performed"
              placeholder="Enter each task on a new line, e.g.:&#10;Oil change&#10;Filter replacement&#10;Battery test"
              value={formData.workPerformed}
              onChange={(e) => updateField('workPerformed', e.target.value)}
              rows={4}
              disabled={isLoading}
              helperText="Enter each task on a separate line"
            />
          </motion.div>
        )}

        {/* VERIFICATION fields */}
        {eventType === 1 && (
          <motion.div key="verification" {...fadeVariants} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Verifier Name"
                placeholder="e.g., Verification Corp"
                value={formData.verifierName}
                onChange={(e) => updateField('verifierName', e.target.value)}
                error={errors.verifierName}
                disabled={isLoading}
              />
              <Input
                label="Verification Method"
                placeholder="e.g., Serial number check"
                value={formData.verificationMethod}
                onChange={(e) => updateField('verificationMethod', e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-primary)] mb-[var(--spacing-1)]">
                Verification Result
              </label>
              <select
                value={formData.result}
                onChange={(e) => updateField('result', e.target.value)}
                disabled={isLoading}
                className={`
                  w-full h-9 px-[var(--spacing-3)] py-[var(--spacing-2)]
                  bg-[var(--color-bg-secondary)] border border-transparent
                  rounded-[var(--radius-md)] text-[var(--font-size-sm)] text-[var(--color-text-primary)]
                  transition-all duration-[var(--transition-fast)]
                  focus:outline-none focus:bg-[var(--color-bg-primary)]
                  focus:border-[var(--color-border-focus)] focus:ring-1 focus:ring-[var(--color-border-focus)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${errors.result ? 'border-[var(--color-accent-red)] bg-[var(--color-accent-red-light)]' : ''}
                `}
              >
                <option value="">Select result...</option>
                {VERIFICATION_RESULTS.map((result) => (
                  <option key={result} value={result}>{result}</option>
                ))}
              </select>
              {errors.result && (
                <p className="mt-[var(--spacing-1)] text-[var(--font-size-xs)] text-[var(--color-accent-red)]">
                  {errors.result}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* WARRANTY fields */}
        {eventType === 2 && (
          <motion.div key="warranty" {...fadeVariants} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Provider Name"
                placeholder="e.g., Manufacturer Inc."
                value={formData.providerName}
                onChange={(e) => updateField('providerName', e.target.value)}
                error={errors.providerName}
                disabled={isLoading}
              />
              <div>
                <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-primary)] mb-[var(--spacing-1)]">
                  Warranty Type
                </label>
                <select
                  value={formData.warrantyType}
                  onChange={(e) => updateField('warrantyType', e.target.value)}
                  disabled={isLoading}
                  className={`
                    w-full h-9 px-[var(--spacing-3)] py-[var(--spacing-2)]
                    bg-[var(--color-bg-secondary)] border border-transparent
                    rounded-[var(--radius-md)] text-[var(--font-size-sm)] text-[var(--color-text-primary)]
                    transition-all duration-[var(--transition-fast)]
                    focus:outline-none focus:bg-[var(--color-bg-primary)]
                    focus:border-[var(--color-border-focus)] focus:ring-1 focus:ring-[var(--color-border-focus)]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${errors.warrantyType ? 'border-[var(--color-accent-red)] bg-[var(--color-accent-red-light)]' : ''}
                  `}
                >
                  <option value="">Select warranty type...</option>
                  {WARRANTY_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.warrantyType && (
                  <p className="mt-[var(--spacing-1)] text-[var(--font-size-xs)] text-[var(--color-accent-red)]">
                    {errors.warrantyType}
                  </p>
                )}
              </div>
            </div>
            <Input
              label="Warranty Expiry Date"
              type="date"
              value={formData.warrantyExpiry}
              onChange={(e) => updateField('warrantyExpiry', e.target.value)}
              disabled={isLoading}
            />
            <Textarea
              label="Claim Details"
              placeholder="Details about the warranty claim, extension, or transfer..."
              value={formData.claimDetails}
              onChange={(e) => updateField('claimDetails', e.target.value)}
              rows={3}
              disabled={isLoading}
            />
          </motion.div>
        )}

        {/* CERTIFICATION fields */}
        {eventType === 3 && (
          <motion.div key="certification" {...fadeVariants} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Certifying Body"
                placeholder="e.g., ISO, CE, UL"
                value={formData.certifyingBody}
                onChange={(e) => updateField('certifyingBody', e.target.value)}
                error={errors.certifyingBody}
                disabled={isLoading}
              />
              <Input
                label="Certificate Number"
                placeholder="e.g., CERT-2024-001"
                value={formData.certificateNumber}
                onChange={(e) => updateField('certificateNumber', e.target.value)}
                error={errors.certificateNumber}
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Certification Type"
                placeholder="e.g., Quality, Safety, Environmental"
                value={formData.certificationType}
                onChange={(e) => updateField('certificationType', e.target.value)}
                disabled={isLoading}
              />
              <Input
                label="Expiry Date"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => updateField('expiryDate', e.target.value)}
                disabled={isLoading}
              />
            </div>
          </motion.div>
        )}

        {/* CUSTOM fields */}
        {eventType === 4 && (
          <motion.div key="custom" {...fadeVariants} className="space-y-4">
            <Textarea
              label="Additional Data (JSON)"
              placeholder={`{
  "customField1": "value1",
  "customField2": "value2"
}`}
              value={formData.customData}
              onChange={(e) => updateField('customData', e.target.value)}
              error={errors.customData}
              helperText="Optional: Enter additional data as JSON"
              rows={4}
              disabled={isLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes field (common to all types) */}
      <Textarea
        label="Notes (Optional)"
        placeholder="Any additional notes or comments..."
        value={formData.notes}
        onChange={(e) => updateField('notes', e.target.value)}
        rows={2}
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
