import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { isAddress } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardBody, CardHeader, Button, Input, Textarea } from '@/components/common';
import { useMintPassport, useIsMinter, useNextTokenId, useCreateAsset, useUpdateMintStatus, useIsBackendAvailable } from '@/hooks';
import { useAuth } from '@/providers';
import { useToast } from '@/hooks/useToast';
import { hashMetadata } from '@/lib';
import { fadeVariants } from '@/lib/animations';

interface MintPassportFormProps {
  onSuccess?: (tokenId: string) => void;
}

interface FormData {
  recipient: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  manufacturedDate: string;
  description: string;
}

interface FormErrors {
  recipient?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  manufacturedDate?: string;
}

export function MintPassportForm({ onSuccess }: MintPassportFormProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const toast = useToast();
  const { isAuthenticated, signIn, isLoading: authLoading } = useAuth();
  const { isAvailable: isBackendAvailable, isChecking: isCheckingBackend } = useIsBackendAvailable();

  const [formData, setFormData] = useState<FormData>({
    recipient: '',
    model: '',
    manufacturer: '',
    serialNumber: '',
    manufacturedDate: '',
    description: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [useLegacyMode, setUseLegacyMode] = useState(false);
  const [legacyMetadata, setLegacyMetadata] = useState('');

  const { data: isMinter } = useIsMinter(address, chainId);
  const { data: nextTokenId } = useNextTokenId(chainId);
  const { mint, isPending: isMinting, isConfirming, isSuccess, error: mintError, hash } = useMintPassport(chainId);
  const { mutateAsync: createAsset, isPending: isCreatingAsset } = useCreateAsset();
  const { mutateAsync: updateMintStatus } = useUpdateMintStatus();

  // Track if we've already handled success/error
  const handledHash = useRef<string | null>(null);
  const handledError = useRef<Error | null>(null);

  // Track the pending asset ID for status updates
  const pendingAssetId = useRef<number | null>(null);

  // Auto-fill recipient with connected address on mount only
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (address && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(prev => prev.recipient ? prev : { ...prev, recipient: address });
    }
  }, [address]);

  // Reset form helper
  const resetForm = useCallback(() => {
    setFormData({
      recipient: address || '',
      manufacturer: '',
      model: '',
      serialNumber: '',
      manufacturedDate: '',
      description: '',
    });
    setLegacyMetadata('');
  }, [address]);

  // Handle minting success
  useEffect(() => {
    if (isSuccess && hash && handledHash.current !== hash) {
      handledHash.current = hash;
      toast.success('Passport minted successfully!');
      onSuccess?.(hash);

      // Update mint status in backend
      if (pendingAssetId.current && isBackendAvailable && !useLegacyMode) {
        updateMintStatus({
          assetId: pendingAssetId.current,
          data: { status: 'MINTED', txHash: hash },
        }).catch(() => {
          // Silently fail - the mint succeeded on-chain which is what matters
        });
        pendingAssetId.current = null;
      }

      // eslint-disable-next-line react-hooks/set-state-in-effect
      resetForm();
    }
  }, [isSuccess, hash, toast, onSuccess, resetForm, updateMintStatus, isBackendAvailable, useLegacyMode]);

  // Handle minting error
  useEffect(() => {
    if (mintError && handledError.current !== mintError) {
      handledError.current = mintError;
      toast.error(mintError.message || 'Failed to mint passport');

      // Update mint status to FAILED in backend
      if (pendingAssetId.current && isBackendAvailable && !useLegacyMode) {
        updateMintStatus({
          assetId: pendingAssetId.current,
          data: { status: 'FAILED' },
        }).catch(() => {
          // Silently fail
        });
        pendingAssetId.current = null;
      }
    }
  }, [mintError, toast, updateMintStatus, isBackendAvailable, useLegacyMode]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.recipient) {
      newErrors.recipient = 'Recipient address is required';
    } else if (!isAddress(formData.recipient)) {
      newErrors.recipient = 'Invalid Ethereum address';
    }

    if (!useLegacyMode) {
      if (!formData.manufacturer.trim()) {
        newErrors.manufacturer = 'Manufacturer is required';
      }
      if (!formData.model.trim()) {
        newErrors.model = 'Model is required';
      }
      if (!formData.serialNumber.trim()) {
        newErrors.serialNumber = 'Serial number is required';
      }
      if (!formData.manufacturedDate) {
        newErrors.manufacturedDate = 'Manufactured date is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Legacy mode: hash locally and mint directly
    if (useLegacyMode || !isBackendAvailable) {
      if (!nextTokenId) {
        toast.error('Unable to get next token ID');
        return;
      }

      try {
        let metadataHash: `0x${string}`;
        if (useLegacyMode && legacyMetadata) {
          // For legacy JSON mode, parse and add assetId
          const parsed = JSON.parse(legacyMetadata);
          const withAssetId = { assetId: Number(nextTokenId), ...parsed };
          metadataHash = hashMetadata(withAssetId);
        } else {
          // Include assetId in hash for uniqueness even with identical metadata
          const metadata = {
            assetId: Number(nextTokenId),
            manufacturer: formData.manufacturer,
            model: formData.model,
            serialNumber: formData.serialNumber,
            manufacturedDate: formData.manufacturedDate,
            description: formData.description,
          };
          metadataHash = hashMetadata(metadata);
        }
        mint(formData.recipient as `0x${string}`, metadataHash);
      } catch {
        toast.error('Invalid metadata format');
      }
      return;
    }

    // Backend mode: create asset first, then mint
    if (!isAuthenticated) {
      toast.info('Please sign in to mint with backend verification');
      return;
    }

    if (!nextTokenId) {
      toast.error('Unable to get next token ID');
      return;
    }

    try {
      // Create asset in backend
      const assetId = Number(nextTokenId);
      const response = await createAsset({
        assetId,
        manufacturer: formData.manufacturer,
        model: formData.model,
        serialNumber: formData.serialNumber,
        manufacturedDate: formData.manufacturedDate,
        description: formData.description || undefined,
      });

      // Track the asset ID for status update after mint
      pendingAssetId.current = assetId;

      // Mint with the hash from backend
      mint(formData.recipient as `0x${string}`, response.data.dataHash as `0x${string}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create asset');
    }
  };

  const isLoading = isMinting || isConfirming || isCreatingAsset || authLoading;

  // Not connected state
  if (!isConnected) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-[var(--color-text-secondary)]">
            Please connect your wallet to mint passports.
          </p>
        </CardBody>
      </Card>
    );
  }

  // Not authorized state
  if (isMinter === false) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--color-accent-red-light)] flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--color-accent-red)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-[var(--color-text-secondary)]">
            Your address is not authorized to mint passports.
          </p>
          <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] mt-2">
            Only authorized minters can create new asset passports.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-[var(--font-size-xl)] font-semibold text-[var(--color-text-primary)]">
            Mint New Passport
          </h2>
          {!isCheckingBackend && (
            <span className={`
              text-[var(--font-size-xs)] px-2 py-1 rounded-full
              ${isBackendAvailable
                ? 'bg-[var(--color-accent-green-light)] text-[var(--color-accent-green)]'
                : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'
              }
            `}>
              {isBackendAvailable ? 'Backend Connected' : 'Offline Mode'}
            </span>
          )}
        </div>
      </CardHeader>
      <CardBody>
        {/* Backend authentication prompt */}
        {isBackendAvailable && !isAuthenticated && !useLegacyMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 p-3 bg-[rgba(35,131,226,0.05)] border border-[var(--color-accent-blue)] rounded-[var(--radius-md)]"
          >
            <div className="flex items-center justify-between">
              <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
                Sign in to store metadata off-chain for verification
              </p>
              <Button
                size="sm"
                onClick={() => signIn()}
                loading={authLoading}
              >
                Sign In
              </Button>
            </div>
          </motion.div>
        )}

        {/* Mode toggle (only when backend is available) */}
        {isBackendAvailable && (
          <div className="mb-4">
            <label className="flex items-center gap-2 text-[var(--font-size-sm)] text-[var(--color-text-secondary)] cursor-pointer">
              <input
                type="checkbox"
                checked={useLegacyMode}
                onChange={(e) => setUseLegacyMode(e.target.checked)}
                className="rounded"
              />
              Use legacy mode (JSON input, no backend verification)
            </label>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Recipient Address"
            placeholder="0x..."
            value={formData.recipient}
            onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
            error={errors.recipient}
            helperText="The address that will receive the passport NFT"
            disabled={isLoading}
          />

          <AnimatePresence mode="wait">
            {useLegacyMode ? (
              <motion.div key="legacy" {...fadeVariants}>
                <Textarea
                  label="Metadata (JSON)"
                  placeholder={`{
  "name": "Asset Name",
  "manufacturer": "Manufacturer",
  "model": "Model Number",
  "serialNumber": "SN-123456"
}`}
                  value={legacyMetadata}
                  onChange={(e) => setLegacyMetadata(e.target.value)}
                  helperText="JSON metadata that will be hashed and stored on-chain"
                  rows={6}
                  disabled={isLoading}
                />
              </motion.div>
            ) : (
              <motion.div key="structured" {...fadeVariants} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Manufacturer"
                    placeholder="e.g., Apple, Sony, Toyota"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                    error={errors.manufacturer}
                    disabled={isLoading}
                  />
                  <Input
                    label="Model"
                    placeholder="e.g., iPhone 15 Pro, PlayStation 5"
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    error={errors.model}
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Serial Number"
                    placeholder="e.g., SN-123456789"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                    error={errors.serialNumber}
                    disabled={isLoading}
                  />
                  <Input
                    label="Manufactured Date"
                    type="date"
                    value={formData.manufacturedDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, manufacturedDate: e.target.value }))}
                    error={errors.manufacturedDate}
                    disabled={isLoading}
                  />
                </div>

                <Textarea
                  label="Description (Optional)"
                  placeholder="Enter a brief description of the asset..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  disabled={isLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            fullWidth
            loading={isLoading}
            disabled={isLoading || (!useLegacyMode && isBackendAvailable && !isAuthenticated)}
          >
            {isMinting ? 'Confirm in Wallet...' : isConfirming ? 'Minting...' : isCreatingAsset ? 'Creating Asset...' : 'Mint Passport'}
          </Button>

          {hash && (
            <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] text-center">
              Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
            </p>
          )}
        </form>
      </CardBody>
    </Card>
  );
}
