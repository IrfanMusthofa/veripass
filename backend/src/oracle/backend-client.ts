import axios, { AxiosInstance } from "axios";
import { config } from "../lib/config";
import type { VerificationRequestResponse } from "../dtos/verification.dto";
import type { ServiceRecordResponse } from "../dtos/service-record.dto";

class BackendClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `http://localhost:${config.port}`,
      headers: {
        "Content-Type": "application/json",
        "X-Oracle-Key": config.oracle.apiKey,
      },
    });
  }

  async getPendingRequests(): Promise<VerificationRequestResponse[]> {
    const response = await this.client.get("/api/verification-requests/pending");
    return response.data.data;
  }

  async getServiceRecords(assetId: number): Promise<ServiceRecordResponse[]> {
    const response = await this.client.get(`/api/service-records/${assetId}`);
    return response.data.data;
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
