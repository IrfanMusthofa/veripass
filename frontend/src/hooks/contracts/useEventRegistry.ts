import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import type { Address } from 'viem';
import { EventRegistryABI, getContractAddresses } from '@/config/contracts';
import type { LifecycleEvent } from '@/types';

/**
 * Get contract address for current chain
 */
function useEventRegistryAddress(chainId: number | undefined): Address | undefined {
  if (!chainId) return undefined;
  try {
    return getContractAddresses(chainId).eventRegistry;
  } catch {
    return undefined;
  }
}

/**
 * Get all events for an asset
 */
export function useAssetEvents(assetId: bigint | undefined, chainId: number | undefined) {
  const address = useEventRegistryAddress(chainId);

  return useReadContract({
    address,
    abi: EventRegistryABI,
    functionName: 'getEventsByAsset',
    args: assetId !== undefined ? [assetId] : undefined,
    query: {
      enabled: !!address && assetId !== undefined,
    },
  });
}

/**
 * Get events by type for an asset
 */
export function useAssetEventsByType(
  assetId: bigint | undefined,
  eventType: number | undefined,
  chainId: number | undefined
) {
  const address = useEventRegistryAddress(chainId);

  return useReadContract({
    address,
    abi: EventRegistryABI,
    functionName: 'getEventsByType',
    args: assetId !== undefined && eventType !== undefined ? [assetId, eventType] : undefined,
    query: {
      enabled: !!address && assetId !== undefined && eventType !== undefined,
    },
  });
}

/**
 * Get a single event by ID
 */
export function useEvent(eventId: bigint | undefined, chainId: number | undefined) {
  const address = useEventRegistryAddress(chainId);

  return useReadContract({
    address,
    abi: EventRegistryABI,
    functionName: 'getEvent',
    args: eventId !== undefined ? [eventId] : undefined,
    query: {
      enabled: !!address && eventId !== undefined,
    },
  });
}

/**
 * Get event count for an asset
 */
export function useEventCount(assetId: bigint | undefined, chainId: number | undefined) {
  const address = useEventRegistryAddress(chainId);

  return useReadContract({
    address,
    abi: EventRegistryABI,
    functionName: 'getEventCount',
    args: assetId !== undefined ? [assetId] : undefined,
    query: {
      enabled: !!address && assetId !== undefined,
    },
  });
}

/**
 * Check if address is a trusted oracle
 */
export function useIsTrustedOracle(account: Address | undefined, chainId: number | undefined) {
  const address = useEventRegistryAddress(chainId);

  return useReadContract({
    address,
    abi: EventRegistryABI,
    functionName: 'isTrustedOracle',
    args: account ? [account] : undefined,
    query: {
      enabled: !!address && !!account,
    },
  });
}

/**
 * Record a new event (asset owner only)
 */
export function useRecordEvent(chainId: number | undefined) {
  const address = useEventRegistryAddress(chainId);
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const recordEvent = (assetId: bigint, eventType: number, dataHash: `0x${string}`) => {
    console.log('🔴 recordEvent called:', {
      address,
      chainId,
      assetId: assetId.toString(),
      eventType,
      dataHash,
    });
    if (!address) {
      console.error('❌ No address found for EventRegistry!');
      return;
    }
    writeContract({
      address,
      abi: EventRegistryABI,
      functionName: 'recordEvent',
      args: [assetId, eventType, dataHash],
    });
  };

  return {
    recordEvent,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Record a verified event (oracle only)
 */
export function useRecordVerifiedEvent(chainId: number | undefined) {
  const address = useEventRegistryAddress(chainId);
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const recordVerifiedEvent = (
    assetId: bigint,
    dataHash: `0x${string}`,
    oracleSignature: `0x${string}`
  ) => {
    if (!address) return;
    writeContract({
      address,
      abi: EventRegistryABI,
      functionName: 'recordVerifiedEvent',
      args: [assetId, dataHash, oracleSignature],
    });
  };

  return {
    recordVerifiedEvent,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Parse raw event data from contract to typed LifecycleEvent
 */
export function parseLifecycleEvent(raw: readonly [bigint, bigint, number, Address, bigint, `0x${string}`]): LifecycleEvent {
  return {
    id: raw[0],
    assetId: raw[1],
    eventType: raw[2],
    submitter: raw[3],
    timestamp: raw[4],
    dataHash: raw[5],
  };
}

/**
 * Parse array of raw events
 */
export function parseLifecycleEvents(
  raw: readonly (readonly [bigint, bigint, number, Address, bigint, `0x${string}`])[]
): LifecycleEvent[] {
  return raw.map(parseLifecycleEvent);
}
