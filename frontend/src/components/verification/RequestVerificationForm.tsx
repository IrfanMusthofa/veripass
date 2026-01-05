import { useState } from 'react';
import { Modal, Button, Input } from '@/components/common';
import { useCreateVerificationRequest, useIsBackendAvailable } from '@/hooks';
import { useToast } from '@/hooks/useToast';
import type { RequestType } from '@/types/api';

interface RequestVerificationFormProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: number;
  onSuccess?: (requestId: string) => void;
}

const requestTypes: { value: RequestType; label: string; description: string }[] = [
  {
    value: 'SERVICE_VERIFICATION',
    label: 'Service Verification',
    description: 'Verify service records from authorized providers',
  },
  {
    value: 'AUTHENTICITY_CHECK',
    label: 'Authenticity Check',
    description: 'Verify the authenticity of the asset',
  },
];

export function RequestVerificationForm({
  isOpen,
  onClose,
  assetId,
  onSuccess,
}: RequestVerificationFormProps) {
  const toast = useToast();
  const { isAvailable: isBackendAvailable } = useIsBackendAvailable();
  const { mutate: createRequest, isPending } = useCreateVerificationRequest();

  const [requestType, setRequestType] = useState<RequestType>('SERVICE_VERIFICATION');
  const [providerId, setProviderId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isBackendAvailable) {
      toast.error('Backend is unavailable. Please try again later.');
      return;
    }

    createRequest(
      {
        assetId,
        requestType,
        providerId: providerId || undefined,
      },
      {
        onSuccess: (response) => {
          toast.success('Verification request submitted successfully');
          onSuccess?.(response.data.requestId);
          onClose();
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to submit verification request');
        },
      }
    );
  };

  const handleClose = () => {
    if (!isPending) {
      setRequestType('SERVICE_VERIFICATION');
      setProviderId('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Request Verification" size="md">
      {!isBackendAvailable ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
          </div>
          <p className="text-[var(--color-text-secondary)]">
            Backend service is currently unavailable.
          </p>
          <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mt-1">
            Please try again later.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[var(--font-size-sm)] font-medium text-[var(--color-text-primary)] mb-2">
              Verification Type
            </label>
            <div className="space-y-2">
              {requestTypes.map((type) => (
                <label
                  key={type.value}
                  className={`
                    flex items-start gap-3 p-3
                    rounded-[var(--radius-md)]
                    border cursor-pointer
                    transition-colors duration-[var(--transition-fast)]
                    ${requestType === type.value
                      ? 'border-[var(--color-accent-blue)] bg-[rgba(35,131,226,0.05)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="requestType"
                    value={type.value}
                    checked={requestType === type.value}
                    onChange={(e) => setRequestType(e.target.value as RequestType)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-[var(--font-size-sm)] font-medium text-[var(--color-text-primary)]">
                      {type.label}
                    </p>
                    <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
                      {type.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Input
            label="Provider ID (Optional)"
            placeholder="Enter provider identifier"
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
            helperText="Specify a provider to verify against specific service records"
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isPending}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isPending}
              fullWidth
            >
              Submit Request
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
