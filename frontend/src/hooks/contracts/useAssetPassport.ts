import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import type { Address } from 'viem';
import { AssetPassportABI, getContractAddresses } from '@/config/contracts';
import type { AssetInfo } from '@/types';

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
