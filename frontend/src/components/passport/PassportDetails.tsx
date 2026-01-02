import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardBody, CardHeader, Badge, Button } from '@/components/common';
import { truncateAddress, formatTimestamp, truncateHash } from '@/lib';
import { TransferPassportForm } from './TransferPassportForm';
import type { Passport } from '@/types';

interface PassportDetailsProps {
  passport: Passport;
  onTransferSuccess?: () => void;
}

export function PassportDetails({ passport, onTransferSuccess }: PassportDetailsProps) {
  const { address } = useAccount();
  const [showTransfer, setShowTransfer] = useState(false);

  const isOwner = address?.toLowerCase() === passport.owner.toLowerCase();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Passport #{passport.tokenId.toString()}
            </h2>
            <Badge
              variant={passport.isActive ? 'success' : 'error'}
              size="md"
            >
              {passport.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>

        <CardBody className="space-y-4">
          {/* Owner */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Owner</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-gray-900">
                {truncateAddress(passport.owner, 6)}
              </span>
              {isOwner && (
                <Badge variant="info" size="sm">You</Badge>
              )}
              <button
                onClick={() => copyToClipboard(passport.owner)}
                className="text-gray-400 hover:text-gray-600"
                title="Copy address"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Metadata Hash */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Metadata Hash</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-gray-900 text-sm">
                {truncateHash(passport.metadataHash, 8)}
              </span>
              <button
                onClick={() => copyToClipboard(passport.metadataHash)}
                className="text-gray-400 hover:text-gray-600"
                title="Copy hash"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mint Timestamp */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Minted At</span>
            <span className="text-gray-900">
              {formatTimestamp(Number(passport.mintTimestamp))}
            </span>
          </div>

          {/* Token ID */}
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-500">Token ID</span>
            <span className="font-mono text-gray-900">
              {passport.tokenId.toString()}
            </span>
          </div>

          {/* Actions */}
          {isOwner && passport.isActive && (
            <div className="pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowTransfer(true)}
                className="w-full"
              >
                Transfer Passport
              </Button>
            </div>
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
    </>
  );
}
