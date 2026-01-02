// Type definitions for VeriPass contracts
// These mirror the Solidity struct definitions

export interface AssetInfo {
    metadataHash: string; // bytes32
    mintTimestamp: number; // uint40
    isActive: boolean;
}

export enum EventType {
    MAINTENANCE = 0,
    VERIFICATION = 1,
    WARRANTY = 2,
    CERTIFICATION = 3,
    CUSTOM = 4,
}

export interface LifecycleEvent {
    id: bigint; // uint256
    assetId: bigint; // uint256
    eventType: EventType;
    submitter: string; // address
    timestamp: number; // uint40
    dataHash: string; // bytes32
}
