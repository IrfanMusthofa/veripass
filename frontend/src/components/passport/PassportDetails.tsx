import { useState } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader, Badge, Button } from '@/components/common';
import { Skeleton } from '@/components/design-system';
import { VerificationBadge, VerificationDetails, RequestVerificationForm } from '@/components/verification';
import { truncateAddress, formatTimestamp, truncateHash } from '@/lib';
import { useAssetByHash, useIsBackendAvailable } from '@/hooks';
import { useToast } from '@/hooks/useToast';
import { TransferPassportForm } from './TransferPassportForm';
import { staggerItem } from '@/lib/animations';
import type { Passport } from '@/types';

interface PassportDetailsProps {
  passport: Passport;
  onTransferSuccess?: () => void;
}

export function PassportDetails({ passport, onTransferSuccess }: PassportDetailsProps) {
  const { address } = useAccount();
  const toast = useToast();
  const [showTransfer, setShowTransfer] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  const { isAvailable: isBackendAvailable } = useIsBackendAvailable();
  const { data: assetData, isLoading: isLoadingAsset } = useAssetByHash(passport.metadataHash, isBackendAvailable);
  const asset = assetData?.data;

  const isOwner = address?.toLowerCase() === passport.owner.toLowerCase();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-[var(--font-size-xl)] font-semibold text-[var(--color-text-primary)]">
                Passport #{passport.tokenId.toString()}
              </h2>
              <Badge
                variant={passport.isActive ? 'success' : 'error'}
                size="md"
              >
                {passport.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <VerificationBadge
              onChainHash={passport.metadataHash}
              offChainHash={asset?.dataHash}
              isLoading={isLoadingAsset}
            />
          </div>
        </CardHeader>

        <CardBody className="space-y-6">
          {/* Asset Metadata (from backend) */}
          {isBackendAvailable && (
            <motion.div
              variants={staggerItem}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              <h3 className="text-[var(--font-size-sm)] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                Asset Information
              </h3>

              {isLoadingAsset ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="text" width="70%" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="text" width="70%" />
                  </div>
                </div>
              ) : asset ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoItem label="Manufacturer" value={asset.manufacturer} />
                  <InfoItem label="Model" value={asset.model} />
                  <InfoItem label="Serial Number" value={asset.serialNumber} />
                  <InfoItem label="Manufactured Date" value={asset.manufacturedDate || 'N/A'} />
                  {asset.description && (
                    <div className="sm:col-span-2">
                      <InfoItem label="Description" value={asset.description} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-[var(--radius-md)]">
                  <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
                    Metadata not found in backend. Only on-chain data is available.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Verification Details */}
          <motion.div
            variants={staggerItem}
            initial="hidden"
            animate="visible"
          >
            <VerificationDetails
              onChainHash={passport.metadataHash}
              offChainHash={asset?.dataHash}
              isLoading={isLoadingAsset}
            />
          </motion.div>

          {/* Blockchain Info */}
          <motion.div
            variants={staggerItem}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            <h3 className="text-[var(--font-size-sm)] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
              Blockchain Data
            </h3>

            {/* Owner */}
            <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
              <span className="text-[var(--color-text-secondary)]">Owner</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[var(--font-size-sm)] text-[var(--color-text-primary)]">
                  {truncateAddress(passport.owner, 6)}
                </span>
                {isOwner && (
                  <Badge variant="info" size="sm">You</Badge>
                )}
                <CopyButton text={passport.owner} onCopy={copyToClipboard} />
              </div>
            </div>

            {/* Metadata Hash */}
            <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
              <span className="text-[var(--color-text-secondary)]">Metadata Hash</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[var(--font-size-sm)] text-[var(--color-text-primary)]">
                  {truncateHash(passport.metadataHash, 8)}
                </span>
                <CopyButton text={passport.metadataHash} onCopy={copyToClipboard} />
              </div>
            </div>

            {/* Mint Timestamp */}
            <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
              <span className="text-[var(--color-text-secondary)]">Minted At</span>
              <span className="text-[var(--color-text-primary)]">
                {formatTimestamp(Number(passport.mintTimestamp))}
              </span>
            </div>

            {/* Token ID */}
            <div className="flex items-center justify-between py-2">
              <span className="text-[var(--color-text-secondary)]">Token ID</span>
              <span className="font-mono text-[var(--color-text-primary)]">
                {passport.tokenId.toString()}
              </span>
            </div>
          </motion.div>

          {/* Actions */}
          {isOwner && passport.isActive && (
            <motion.div
              variants={staggerItem}
              initial="hidden"
              animate="visible"
              className="pt-4 border-t border-[var(--color-border)] space-y-3"
            >
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowTransfer(true)}
                  fullWidth
                >
                  Transfer Passport
                </Button>
                {isBackendAvailable && (
                  <Button
                    variant="secondary"
                    onClick={() => setShowVerification(true)}
                    fullWidth
                  >
                    Request Verification
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </CardBody>
      </Card>

      {/* Transfer Modal */}
      <TransferPassportForm
        isOpen={showTransfer}
        onClose={() => setShowTransfer(false)}
        passport={passport}
        onSuccess={() => {
          setShowTransfer(false);
          onTransferSuccess?.();
        }}
      />

      {/* Verification Request Modal */}
      <RequestVerificationForm
        isOpen={showVerification}
        onClose={() => setShowVerification(false)}
        assetId={Number(passport.tokenId)}
        onSuccess={() => {
          toast.success('Verification request submitted');
        }}
      />
    </>
  );
}

// Helper components
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mb-1">
        {label}
      </p>
      <p className="text-[var(--font-size-sm)] text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  );
}

function CopyButton({ text, onCopy }: { text: string; onCopy: (text: string) => void }) {
  return (
    <button
      onClick={() => onCopy(text)}
      className="
        p-1
        text-[var(--color-text-muted)]
        hover:text-[var(--color-text-primary)]
        hover:bg-[var(--color-bg-hover)]
        rounded-[var(--radius-sm)]
        transition-colors duration-[var(--transition-fast)]
      "
      title="Copy to clipboard"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </button>
  );
}
