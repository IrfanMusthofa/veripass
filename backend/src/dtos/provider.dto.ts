import { z } from "zod";
import type { ServiceRecordProviderA, ProcessedServiceRecord } from "../db/schema";

// Valid event types that providers can submit
export const ProviderEventType = {
  MAINTENANCE: "MAINTENANCE",
  VERIFICATION: "VERIFICATION",
  WARRANTY: "WARRANTY",
  CERTIFICATION: "CERTIFICATION",
} as const;

// Schema for creating a service record via provider API
export const createServiceRecordSchema = z.object({
  assetId: z.number().int().positive(),
  eventType: z.enum([
    ProviderEventType.MAINTENANCE,
    ProviderEventType.VERIFICATION,
    ProviderEventType.WARRANTY,
    ProviderEventType.CERTIFICATION,
  ]),
  eventName: z.string().min(1).max(255), // "Service RAM", "Battery Replacement", etc.
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  technicianName: z.string().max(255).optional(),
  technicianNotes: z.string().optional(),
  workPerformed: z.array(z.string()).optional(),
  partsReplaced: z
    .array(
      z.object({
        name: z.string(),
        partNumber: z.string().optional(),
        quantity: z.number().int().positive().optional(),
      })
    )
    .optional(),
});

export const recordIdParamSchema = z.object({
  recordId: z.string().min(1),
});

export type CreateServiceRecordInput = z.infer<typeof createServiceRecordSchema>;
export type RecordIdParam = z.infer<typeof recordIdParamSchema>;

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
  // Processing status (from processed_service_records if available)
  processingStatus?: string;
  evidenceId?: number | null;
  blockchainEventId?: number | null;
  txHash?: string | null;
}

export function formatServiceRecordResponse(
  record: ServiceRecordProviderA,
  processingInfo?: ProcessedServiceRecord | null
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
    // Include processing info if available
    processingStatus: processingInfo?.status,
    evidenceId: processingInfo?.evidenceId ? Number(processingInfo.evidenceId) : null,
    blockchainEventId: processingInfo?.blockchainEventId
      ? Number(processingInfo.blockchainEventId)
      : null,
    txHash: processingInfo?.txHash,
  };
}
