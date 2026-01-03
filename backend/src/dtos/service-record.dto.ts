import { z } from "zod";
import type { ServiceRecord } from "../db/schema";

export const assetIdParamSchema = z.object({
  assetId: z.coerce.number().int().positive(),
});

export type AssetIdParam = z.infer<typeof assetIdParamSchema>;

export interface ServiceRecordResponse {
  id: number;
  recordId: string;
  assetId: number;
  providerId: string;
  serviceType: string;
  serviceDate: string;
  technician: string | null;
  workPerformed: string[];
  notes: string | null;
  verified: boolean;
  createdAt: string;
}

export function formatServiceRecordResponse(
  record: ServiceRecord
): ServiceRecordResponse {
  return {
    id: record.id,
    recordId: record.recordId,
    assetId: Number(record.assetId),
    providerId: record.providerId,
    serviceType: record.serviceType,
    serviceDate: record.serviceDate,
    technician: record.technician,
    workPerformed: (record.workPerformed as string[]) || [],
    notes: record.notes,
    verified: record.verified,
    createdAt: record.createdAt.toISOString(),
  };
}
