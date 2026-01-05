// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  error: string;
  details?: Record<string, unknown>;
}

// Auth types
export interface NonceResponse {
  nonce: string;
}

export interface VerifyRequest {
  address: string;
  message: string;
  signature: string;
}

export interface AuthResponse {
  token: string;
  address: string;
}

export interface UserResponse {
  address: string;
}

// Asset types
export interface CreateAssetRequest {
  assetId: number;
  manufacturer: string;
  model: string;
  serialNumber: string;
  manufacturedDate: string;
  description?: string;
  images?: string[];
  metadata?: Record<string, unknown>;
}

export type MintStatus = 'PENDING' | 'MINTED' | 'FAILED';

export interface UpdateMintStatusRequest {
  status: 'MINTED' | 'FAILED';
  txHash?: string;
}

export interface AssetResponse {
  id: number;
  assetId: number;
  dataHash: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  manufacturedDate: string | null;
  description: string | null;
  images: string[];
  metadata: Record<string, unknown> | null;
  mintStatus: MintStatus;
  txHash: string | null;
  createdBy: string;
  createdAt: string;
  mintedAt: string | null;
}

// Evidence types
export type EventType = 'MAINTENANCE' | 'VERIFICATION' | 'WARRANTY' | 'CERTIFICATION' | 'CUSTOM';

// Request to calculate hash only (no DB write)
export interface CalculateHashRequest {
  assetId: number;
  eventType: EventType;
  eventDate?: string;
  providerName?: string;
  description?: string;
  notes?: string;
  eventData?: Record<string, unknown>;
}

export interface CalculateHashResponse {
  dataHash: string;
}

// Request to create evidence
// - With txHash: custom event (already on blockchain)
// - Without txHash: oracle flow (will be recorded by oracle)
export interface CreateEvidenceRequest {
  assetId: number;
  eventType: EventType;
  eventDate?: string;
  providerName?: string;
  description?: string;
  notes?: string;
  eventData?: Record<string, unknown>;
  // For custom events (frontend submits after blockchain tx)
  txHash?: string;
  blockchainEventId?: number;
}

export interface EvidenceResponse {
  id: number;
  assetId: number;
  dataHash: string;
  serviceRecordId: number | null;
  eventType: string;
  eventDate: string | null;
  providerName: string | null;
  description: string | null;
  eventData: Record<string, unknown> | null;
  status: string;
  isVerified: boolean;
  verifiedBy: string | null;
  blockchainEventId: number | null;
  txHash: string | null;
  createdBy: string;
  createdAt: string;
  confirmedAt: string | null;
  verifiedAt: string | null;
}

// Service Records (provider-submitted records)
export interface ServiceRecord {
  id: number;
  recordId: string;
  assetId: number;
  providerId: string;
  eventType: string;
  eventName: string;
  serviceDate: string;
  technicianName: string | null;
  technicianNotes: string | null;
  workPerformed: string[] | null;
  partsReplaced: Array<{ name: string; partNumber?: string; quantity?: number }> | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string | null;
  // Processing status (if available)
  processingStatus?: string;
  evidenceId?: number | null;
  blockchainEventId?: number | null;
  txHash?: string | null;
}
