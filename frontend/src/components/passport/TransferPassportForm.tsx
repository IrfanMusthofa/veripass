import { useState, useEffect, useRef } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { isAddress } from 'viem';
import { Modal, Button, Input } from '@/components/common';
import { useTransferPassport } from '@/hooks';
import { useToast } from '@/hooks/useToast';
import { truncateAddress } from '@/lib';
import type { Passport } from '@/types';

interface TransferFormContentProps {
  passport: Passport;
  onClose: () => void;
  onSuccess?: () => void;
}

function TransferFormContent({ passport, onClose, onSuccess }: TransferFormContentProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const toast = useToast();

  const [toAddress, setToAddress] = useState('');
  const [error, setError] = useState<string>();

  const { transfer, isPending, isConfirming, isSuccess, error: txError } = useTransferPassport(chainId);

  // Track if we've already handled success/error
  const handledSuccess = useRef(false);
  const handledError = useRef<Error | null>(null);

  // Handle success
  useEffect(() => {
    if (isSuccess && !handledSuccess.current) {
      handledSuccess.current = true;
      toast.success('Passport transferred successfully!');
      onSuccess?.();
    }
  }, [isSuccess, toast, onSuccess]);

  // Handle error
  useEffect(() => {
    if (txError && handledError.current !== txError) {
      handledError.current = txError;
      toast.error(txError.message || 'Failed to transfer passport');
    }
  }, [txError, toast]);

  const validate = (): boolean => {
    if (!toAddress) {
      setError('Recipient address is required');
      return false;
    }

    if (!isAddress(toAddress)) {
      setError('Invalid Ethereum address');
      return false;
    }

    if (toAddress.toLowerCase() === passport.owner.toLowerCase()) {
      setError('Cannot transfer to current owner');
      return false;
    }

    setError(undefined);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !address) return;

    transfer(passport.owner, toAddress as `0x${string}`, passport.tokenId);
  };

  const isLoading = isPending || isConfirming;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Passport</span>
          <span className="font-medium">#{passport.tokenId.toString()}</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-gray-500">Current Owner</span>
          <span className="font-mono">{truncateAddress(passport.owner)}</span>
        </div>
      </div>

      <Input
        label="Transfer To"
        placeholder="0x..."
        value={toAddress}
        onChange={(e) => setToAddress(e.target.value)}
        error={error}
        helperText="Enter the recipient's Ethereum address"
        disabled={isLoading}
      />

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-sm text-yellow-800">
          <strong>Warning:</strong> This action cannot be undone. Make sure the recipient address is correct.
        </p>
      </div>

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
          {isPending ? 'Confirm...' : isConfirming ? 'Transferring...' : 'Transfer'}
        </Button>
      </div>
    </form>
  );
}

interface TransferPassportFormProps {
  isOpen: boolean;
  onClose: () => void;
  passport: Passport;
  onSuccess?: () => void;
}

export function TransferPassportForm({
  isOpen,
  onClose,
  passport,
  onSuccess,
}: TransferPassportFormProps) {
  // Render form content only when open - this resets state on each open
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transfer Passport"
      size="md"
    >
      {isOpen && (
        <TransferFormContent
          passport={passport}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    </Modal>
  );
}
