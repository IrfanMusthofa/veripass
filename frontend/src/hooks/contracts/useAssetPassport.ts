import { useMemo } from 'react';
import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import type { Address } from 'viem';
import { AssetPassportABI, getContractAddresses } from '@/config/contracts';
import type { AssetInfo, Passport } from '@/types';

/**
 * Get contract address for current chain
 */
function useAssetPassportAddress(chainId: number | undefined): Address | undefined {
  if (!chainId) return undefined;
  try {
    return getContractAddresses(chainId).assetPassport;
  } catch {
    return undefined;
  }
}

/**
 * Get asset info for a token
 */
export function usePassportInfo(tokenId: bigint | undefined, chainId: number | undefined) {
  const address = useAssetPassportAddress(chainId);

  return useReadContract({
    address,
    abi: AssetPassportABI,
    functionName: 'getAssetInfo',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: !!address && tokenId !== undefined,
    },
  });
}

/**
 * Get owner of a token
 */
export function usePassportOwner(tokenId: bigint | undefined, chainId: number | undefined) {
  const address = useAssetPassportAddress(chainId);

  return useReadContract({
    address,
    abi: AssetPassportABI,
    functionName: 'ownerOf',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: !!address && tokenId !== undefined,
    },
  });
}

/**
 * Get ownership hand (custody count) for a token
 */
export function usePassportHand(tokenId: bigint | undefined, chainId: number | undefined) {
  const address = useAssetPassportAddress(chainId);

  return useReadContract({
    address,
    abi: AssetPassportABI,
    functionName: 'getOwnershipHand',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: !!address && tokenId !== undefined,
    },
  });
}

/**
 * Get balance (number of passports) for an address
 */
export function useUserBalance(owner: Address | undefined, chainId: number | undefined) {
  const address = useAssetPassportAddress(chainId);

  return useReadContract({
    address,
    abi: AssetPassportABI,
    functionName: 'balanceOf',
    args: owner ? [owner] : undefined,
    query: {
      enabled: !!address && !!owner,
    },
  });
}

/**
 * Check if address is an authorized minter
 */
export function useIsMinter(account: Address | undefined, chainId: number | undefined) {
  const address = useAssetPassportAddress(chainId);

  return useReadContract({
    address,
    abi: AssetPassportABI,
    functionName: 'isAuthorizedMinter',
    args: account ? [account] : undefined,
    query: {
      enabled: !!address && !!account,
    },
  });
}

/**
 * Get next token ID (total supply + 1)
 */
export function useNextTokenId(chainId: number | undefined) {
  const address = useAssetPassportAddress(chainId);

  return useReadContract({
    address,
    abi: AssetPassportABI,
    functionName: 'nextTokenId',
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Fetch all passports using batched contract reads
 */
export function useAllPassports(chainId: number | undefined) {
  const address = useAssetPassportAddress(chainId);
  const { data: nextTokenId, isLoading: isLoadingCount } = useNextTokenId(chainId);

  // Generate contract read configs for all tokens
  const tokenIdValue = nextTokenId as bigint | undefined;
  const count = tokenIdValue && tokenIdValue > 1n ? Number(tokenIdValue) - 1 : 0;

  const contracts = useMemo(() => {
    if (!address || count === 0) return [];

    const configs = [];
    for (let i = 1; i <= count; i++) {
      // getAssetInfo call
      configs.push({
        address,
        abi: AssetPassportABI,
        functionName: 'getAssetInfo',
        args: [BigInt(i)],
      });
      // ownerOf call
      configs.push({
        address,
        abi: AssetPassportABI,
        functionName: 'ownerOf',
        args: [BigInt(i)],
      });
    }
    return configs;
  }, [address, count]);

  const { data, isLoading } = useReadContracts({
    contracts,
    query: { enabled: contracts.length > 0 },
  });

  // Transform results into Passport array
  const passports = useMemo((): Passport[] => {
    if (!data || count === 0) return [];

    const result: Passport[] = [];

    for (let i = 0; i < count; i++) {
      const assetInfoResult = data[i * 2];
      const ownerResult = data[i * 2 + 1];

      if (
        assetInfoResult?.status === 'success' &&
        ownerResult?.status === 'success'
      ) {
        const assetInfo = assetInfoResult.result as AssetInfo;
        const owner = ownerResult.result as Address;

        result.push({
          tokenId: BigInt(i + 1),
          owner,
          metadataHash: assetInfo.metadataHash,
          mintTimestamp: assetInfo.mintTimestamp,
          isActive: assetInfo.isActive,
        });
      }
    }

    return result;
  }, [data, count]);

  return {
    passports,
    nextTokenId: nextTokenId as bigint | undefined,
    isLoading: isLoadingCount || isLoading,
  };
}

/**
 * Check if contract is paused
 */
export function useIsPaused(chainId: number | undefined) {
  const address = useAssetPassportAddress(chainId);

  return useReadContract({
    address,
    abi: AssetPassportABI,
    functionName: 'paused',
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Mint a new passport
 */
export function useMintPassport(chainId: number | undefined) {
  const address = useAssetPassportAddress(chainId);
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const mint = (to: Address, metadataHash: `0x${string}`) => {
    if (!address) return;
    writeContract({
      address,
      abi: AssetPassportABI,
      functionName: 'mintPassport',
      args: [to, metadataHash],
    });
  };

  return {
    mint,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Transfer a passport
 */
export function useTransferPassport(chainId: number | undefined) {
  const address = useAssetPassportAddress(chainId);
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const transfer = (from: Address, to: Address, tokenId: bigint) => {
    if (!address) return;
    writeContract({
      address,
      abi: AssetPassportABI,
      functionName: 'transferFrom',
      args: [from, to, tokenId],
    });
  };

  return {
    transfer,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Deactivate a passport (owner only)
 */
export function useDeactivatePassport(chainId: number | undefined) {
  const address = useAssetPassportAddress(chainId);
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deactivate = (tokenId: bigint) => {
    if (!address) return;
    writeContract({
      address,
      abi: AssetPassportABI,
      functionName: 'deactivatePassport',
      args: [tokenId],
    });
  };

  return {
    deactivate,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Combined hook for passport data
 */
export function usePassport(tokenId: bigint | undefined, chainId: number | undefined) {
  const { data: assetInfo, isLoading: isLoadingInfo, error: infoError } = usePassportInfo(tokenId, chainId);
  const { data: owner, isLoading: isLoadingOwner, error: ownerError } = usePassportOwner(tokenId, chainId);

  const passport = assetInfo && owner && tokenId !== undefined
    ? {
        tokenId,
        owner: owner as Address,
        metadataHash: (assetInfo as AssetInfo).metadataHash,
        mintTimestamp: (assetInfo as AssetInfo).mintTimestamp,
        isActive: (assetInfo as AssetInfo).isActive,
      }
    : undefined;

  return {
    passport,
    isLoading: isLoadingInfo || isLoadingOwner,
    error: infoError || ownerError,
  };
}
