import type {
  ApiResponse,
  NonceResponse,
  VerifyRequest,
  AuthResponse,
  UserResponse,
  CreateAssetRequest,
  UpdateMintStatusRequest,
  AssetResponse,
  CreateEvidenceRequest,
  ConfirmEvidenceRequest,
  EvidenceResponse,
  CreateVerificationRequest,
  VerificationRequestResponse,
  ServiceRecord,
} from '@/types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'veripass_token';

// Token management
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// API client
class ApiClient {
  private baseUrl: string;
  private isAvailable: boolean = true;
  private lastCheck: number = 0;
  private checkInterval: number = 30000; // 30 seconds

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new ApiError(error.error || 'Request failed', response.status, error.details);
    }

    return response.json();
  }

  async checkAvailability(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastCheck < this.checkInterval) {
      return this.isAvailable;
    }

    try {
      await fetch(`${this.baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      this.isAvailable = true;
    } catch {
      this.isAvailable = false;
    }
    this.lastCheck = now;
    return this.isAvailable;
  }

  getIsAvailable(): boolean {
    return this.isAvailable;
  }

  // Auth endpoints
  async getNonce(address: string): Promise<ApiResponse<NonceResponse>> {
    return this.request<ApiResponse<NonceResponse>>('/api/auth/nonce', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  }

  async verify(data: VerifyRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request<ApiResponse<AuthResponse>>('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<UserResponse>> {
    return this.request<ApiResponse<UserResponse>>('/api/auth/me');
  }

  // Asset endpoints
  async createAsset(data: CreateAssetRequest): Promise<ApiResponse<AssetResponse>> {
    return this.request<ApiResponse<AssetResponse>>('/api/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAssetById(assetId: number): Promise<ApiResponse<AssetResponse>> {
    return this.request<ApiResponse<AssetResponse>>(`/api/assets/${assetId}`);
  }

  async getAssetByHash(hash: string): Promise<ApiResponse<AssetResponse>> {
    return this.request<ApiResponse<AssetResponse>>(`/api/assets/by-hash/${hash}`);
  }

  async updateMintStatus(
    assetId: number,
    data: UpdateMintStatusRequest
  ): Promise<ApiResponse<AssetResponse>> {
    return this.request<ApiResponse<AssetResponse>>(`/api/assets/${assetId}/mint-status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Evidence endpoints
  async createEvidence(data: CreateEvidenceRequest): Promise<ApiResponse<EvidenceResponse>> {
    return this.request<ApiResponse<EvidenceResponse>>('/api/evidence', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async confirmEvidence(evidenceId: number, data: ConfirmEvidenceRequest): Promise<ApiResponse<EvidenceResponse>> {
    return this.request<ApiResponse<EvidenceResponse>>(`/api/evidence/${evidenceId}/confirm`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEvidenceByAsset(assetId: number): Promise<ApiResponse<EvidenceResponse[]>> {
    return this.request<ApiResponse<EvidenceResponse[]>>(`/api/evidence/asset/${assetId}`);
  }

  async getEvidenceByHash(hash: string): Promise<ApiResponse<EvidenceResponse>> {
    return this.request<ApiResponse<EvidenceResponse>>(`/api/evidence/by-hash/${hash}`);
  }

  // Verification request endpoints
  async createVerificationRequest(
    data: CreateVerificationRequest
  ): Promise<ApiResponse<VerificationRequestResponse>> {
    return this.request<ApiResponse<VerificationRequestResponse>>('/api/verification-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Service records endpoint
  async getServiceRecords(assetId: number): Promise<ApiResponse<ServiceRecord[]>> {
    return this.request<ApiResponse<ServiceRecord[]>>(`/api/service-records/${assetId}`);
  }
}

// Custom error class
export class ApiError extends Error {
  status: number;
  details?: Record<string, unknown>;

  constructor(message: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// Export singleton instance
export const api = new ApiClient(API_URL);
