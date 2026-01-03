import axios, { AxiosInstance } from "axios";
import { config } from "./config";
import type { VerificationRequest, ServiceRecord } from "./types";

class BackendClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.backendApiUrl,
      headers: {
        "Content-Type": "application/json",
        "X-Oracle-Key": config.oracleApiKey,
      },
    });
  }

  async getPendingRequests(): Promise<VerificationRequest[]> {
    const response = await this.client.get("/api/verification-requests/pending");
    return response.data;
  }

  async getServiceRecords(assetId: number): Promise<ServiceRecord[]> {
    const response = await this.client.get(`/api/service-records/${assetId}`);
    return response.data;
  }

  async updateRequest(requestId: string, data: Record<string, unknown>): Promise<void> {
    await this.client.patch(`/api/verification-requests/${requestId}`, data);
  }

  async createEvidence(data: Record<string, unknown>): Promise<{ id: number; dataHash: string }> {
    const response = await this.client.post("/api/evidence", data);
    return response.data;
  }
}

export const backendClient = new BackendClient();
