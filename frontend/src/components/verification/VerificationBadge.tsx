import type { ReactNode } from 'react';
import { Badge } from '@/components/common';

type VerificationStatus = 'verified' | 'pending' | 'mismatch' | 'unavailable';

interface VerificationBadgeProps {
  onChainHash?: string;
  offChainHash?: string;
  isLoading?: boolean;
  size?: 'sm' | 'md';
}

const statusConfig: Record<VerificationStatus, {
  variant: 'success' | 'warning' | 'error' | 'default';
  label: string;
  icon: ReactNode;
}> = {
  verified: {
    variant: 'success',
    label: 'Verified',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  pending: {
    variant: 'warning',
    label: 'Verifying...',
    icon: (
      <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ),
  },
  mismatch: {
    variant: 'error',
    label: 'Mismatch',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  unavailable: {
    variant: 'default',
    label: 'Unavailable',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

function getVerificationStatus(
  onChainHash?: string,
  offChainHash?: string,
  isLoading?: boolean
): VerificationStatus {
  if (isLoading) return 'pending';

  // If no on-chain hash or it's zero hash, can't verify
  if (!onChainHash || onChainHash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    return 'unavailable';
  }

  // If we don't have off-chain hash yet, backend might be unavailable
  if (!offChainHash) {
    return 'unavailable';
  }

  // Compare hashes (case-insensitive)
  if (onChainHash.toLowerCase() === offChainHash.toLowerCase()) {
    return 'verified';
  }

  return 'mismatch';
}

export function VerificationBadge({
  onChainHash,
  offChainHash,
  isLoading = false,
  size = 'sm',
}: VerificationBadgeProps) {
  const status = getVerificationStatus(onChainHash, offChainHash, isLoading);
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      size={size}
      icon={config.icon}
    >
      {config.label}
    </Badge>
  );
}

// Detailed verification display with hash comparison
interface VerificationDetailsProps {
  onChainHash?: string;
  offChainHash?: string;
  isLoading?: boolean;
}

export function VerificationDetails({
  onChainHash,
  offChainHash,
  isLoading = false,
}: VerificationDetailsProps) {
  const status = getVerificationStatus(onChainHash, offChainHash, isLoading);

  const truncateHash = (hash: string) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[var(--font-size-sm)] font-medium text-[var(--color-text-primary)]">
          Verification Status
        </span>
        <VerificationBadge
          onChainHash={onChainHash}
          offChainHash={offChainHash}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 bg-[var(--color-bg-secondary)] rounded-[var(--radius-md)]">
          <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mb-1">
            On-Chain Hash
          </p>
          <p className="text-[var(--font-size-sm)] font-mono text-[var(--color-text-primary)]">
            {truncateHash(onChainHash || '')}
          </p>
        </div>
        <div className="p-3 bg-[var(--color-bg-secondary)] rounded-[var(--radius-md)]">
          <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mb-1">
            Off-Chain Hash
          </p>
          <p className="text-[var(--font-size-sm)] font-mono text-[var(--color-text-primary)]">
            {truncateHash(offChainHash || '')}
          </p>
        </div>
      </div>

      {status === 'mismatch' && (
        <div className="p-3 bg-[var(--color-accent-red-light)] rounded-[var(--radius-md)]">
          <p className="text-[var(--font-size-sm)] text-[var(--color-accent-red)]">
            Warning: The on-chain and off-chain hashes do not match. This may indicate data tampering.
          </p>
        </div>
      )}

      {status === 'unavailable' && (
        <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-[var(--radius-md)]">
          <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
            Off-chain data is currently unavailable. Only blockchain data is being displayed.
          </p>
        </div>
      )}
    </div>
  );
}
