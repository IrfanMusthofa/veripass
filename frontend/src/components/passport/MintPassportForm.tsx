import { useState, useEffect, useRef } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { isAddress } from 'viem';
import { Card, CardBody, CardHeader, Button, Input, Textarea } from '@/components/common';
import { useMintPassport, useIsMinter } from '@/hooks';
import { useToast } from '@/hooks/useToast';
import { hashMetadata } from '@/lib';

interface MintPassportFormProps {
  onSuccess?: (tokenId: string) => void;
}

export function MintPassportForm({ onSuccess }: MintPassportFormProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const toast = useToast();

  const [recipient, setRecipient] = useState('');
  const [metadata, setMetadata] = useState('');
  const [errors, setErrors] = useState<{ recipient?: string; metadata?: string }>({});

  const { data: isMinter } = useIsMinter(address, chainId);
  const { mint, isPending, isConfirming, isSuccess, error, hash } = useMintPassport(chainId);

  // Track if we've already handled success/error
  const handledHash = useRef<string | null>(null);
  const handledError = useRef<Error | null>(null);

  // Handle success
  useEffect(() => {
    if (isSuccess && hash && handledHash.current !== hash) {
      handledHash.current = hash;
      toast.success('Passport minted successfully!');
      onSuccess?.(hash);
    }
  }, [isSuccess, hash, toast, onSuccess]);

  // Handle error
  useEffect(() => {
    if (error && handledError.current !== error) {
      handledError.current = error;
      toast.error(error.message || 'Failed to mint passport');
    }
  }, [error, toast]);

  const validate = (): boolean => {
    const newErrors: { recipient?: string; metadata?: string } = {};

    if (!recipient) {
      newErrors.recipient = 'Recipient address is required';
    } else if (!isAddress(recipient)) {
      newErrors.recipient = 'Invalid Ethereum address';
    }

    if (!metadata) {
      newErrors.metadata = 'Metadata is required';
    } else {
      try {
        JSON.parse(metadata);
      } catch {
        newErrors.metadata = 'Metadata must be valid JSON';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const metadataHash = hashMetadata(metadata);
      mint(recipient as `0x${string}`, metadataHash);
    } catch {
      toast.error('Failed to process metadata');
    }
  };

  const isLoading = isPending || isConfirming;

  if (!isConnected) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <p className="text-gray-500">Please connect your wallet to mint passports.</p>
        </CardBody>
      </Card>
    );
  }

  if (isMinter === false) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <p className="text-gray-500">
            Your address is not authorized to mint passports.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Only authorized minters can create new asset passports.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold text-gray-900">Mint New Passport</h2>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Recipient Address"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            error={errors.recipient}
            helperText="The address that will receive the passport NFT"
            disabled={isLoading}
          />

          <Textarea
            label="Metadata (JSON)"
            placeholder={`{
  "name": "Asset Name",
  "description": "Description of the asset",
  "manufacturer": "Manufacturer Name",
  "model": "Model Number",
  "serialNumber": "SN-123456"
}`}
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            error={errors.metadata}
            helperText="JSON metadata that will be hashed and stored on-chain"
            rows={6}
            disabled={isLoading}
          />

          <Button
            type="submit"
            className="w-full"
            loading={isLoading}
            disabled={isLoading}
          >
            {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Minting...' : 'Mint Passport'}
          </Button>

          {hash && (
            <p className="text-sm text-gray-500 text-center">
              Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
            </p>
          )}
        </form>
      </CardBody>
    </Card>
  );
}
