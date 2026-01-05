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

export interface CreateEvidenceRequest {
  assetId: number;
  eventType: EventType;
  eventDate?: string;
  providerName?: string;
  description?: string;
  eventData?: Record<string, unknown>;
}

export interface ConfirmEvidenceRequest {
  txHash: string;
  blockchainEventId?: number;
}

export interface EvidenceResponse {
  id: number;
  assetId: number;
  dataHash: string;
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

// Verification Request types
export type RequestType = 'SERVICE_VERIFICATION' | 'AUTHENTICITY_CHECK';
export type VerificationStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface CreateVerificationRequest {
  assetId: number;
  requestType: RequestType;
  providerId?: string;
}

export interface VerificationRequestResponse {
  id: number;
  requestId: string;
  assetId: number;
  requestType: string;
  providerId: string | null;
  requestedBy: string;
  status: VerificationStatus;
  blockchainEventId: number | null;
  txHash: string | null;
  dataHash: string | null;
  evidenceId: number | null;
  errorMessage: string | null;
  createdAt: string;
  processedAt: string | null;
}

// Service Records (from oracle)
export interface ServiceRecord {
  recordId: string;
  assetId: number;
  providerId: string;
  serviceType: string;
  serviceDate: string;
  technician: string;
  workPerformed: string[];
  notes: string | null;
  verified: boolean;
  createdAt: string;
}
