import type { Address } from 'viem';

/**
 * Asset information from AssetPassport contract
 */
export interface AssetInfo {
  metadataHash: `0x${string}`;
  mintTimestamp: bigint;
  isActive: boolean;
}

/**
 * Event types matching Solidity
 */
export const EventType = {
  MAINTENANCE: 0,
  VERIFICATION: 1,
  WARRANTY: 2,
  CERTIFICATION: 3,
  CUSTOM: 4,
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];

/**
 * Lifecycle event from EventRegistry contract
 */
export interface LifecycleEvent {
  id: bigint;
  assetId: bigint;
  eventType: number;
  submitter: Address;
  timestamp: bigint;
  dataHash: `0x${string}`;
}

/**
 * Passport data combining on-chain and display info
 */
export interface Passport {
  tokenId: bigint;
  owner: Address;
  metadataHash: `0x${string}`;
  mintTimestamp: bigint;
  isActive: boolean;
}
