export interface VerificationRequest {
  id: number;
  requestId: string;
  assetId: number;
  requestType: string;
  providerId: string | null;
  requestedBy: string;
  status: string;
}

export interface ServiceRecord {
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
