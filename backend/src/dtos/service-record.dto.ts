import { z } from "zod";
import type { ServiceRecordProviderA } from "../db/schema";

export const assetIdParamSchema = z.object({
  assetId: z.coerce.number().int().positive(),
});

export type AssetIdParam = z.infer<typeof assetIdParamSchema>;

export interface ServiceRecordResponse {
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
}

export function formatServiceRecordResponse(
  record: ServiceRecordProviderA
): ServiceRecordResponse {
  return {
    id: record.id,
    recordId: record.recordId,
    assetId: Number(record.assetId),
    providerId: record.providerId,
    eventType: record.eventType,
    eventName: record.eventName,
    serviceDate: record.serviceDate,
    technicianName: record.technicianName,
    technicianNotes: record.technicianNotes,
    workPerformed: record.workPerformed,
    partsReplaced: record.partsReplaced,
    verified: record.verified,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt?.toISOString() || null,
  };
}
