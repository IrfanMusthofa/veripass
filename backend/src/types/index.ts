/**
 * Authenticated user context
 */
export interface AuthUser {
  address: string;
}

/**
 * Asset metadata (what gets hashed and stored off-chain)
 */
export interface AssetMetadata {
  manufacturer: string;
  model: string;
  serialNumber: string;
  manufacturedDate: string;
  description?: string;
}

/**
 * Evidence data (what gets hashed and stored off-chain)
 */
export interface EvidenceData {
  assetId: number;
  eventType: string;
  eventDate: string;
  providerId?: string;
  providerName?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Service record from dummy data
 */
export interface ServiceRecordData {
  recordId: string;
  assetId: number;
  providerId: string;
  serviceType: string;
  serviceDate: string;
  technician?: string;
  workPerformed?: string[];
  notes?: string;
  verified: boolean;
}

/**
 * Asset info from smart contract
 */
export interface AssetInfo {
  metadataHash: string;
  mintTimestamp: number;
  isActive: boolean;
}
