import { z } from "zod";
import { EventType } from "../lib/enums";
import type { Evidence } from "../db/schema";

// Schema for calculating hash only (no DB write)
export const calculateEvidenceHashSchema = z.object({
  assetId: z.number().int().positive(),
  eventType: z.enum(Object.values(EventType)),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  providerName: z.string().max(255).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  eventData: z.record(z.string(), z.unknown()).optional(),
});

// Schema for creating evidence
// - If txHash is provided, it's a custom event (already on blockchain) -> create as CONFIRMED
// - If txHash is not provided, it's oracle flow -> create as PENDING
export const createEvidenceSchema = z.object({
  assetId: z.number().int().positive(),
  eventType: z.enum(Object.values(EventType)),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  providerName: z.string().max(255).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  eventData: z.record(z.string(), z.unknown()).optional(),
  // For custom events (frontend submits after blockchain tx)
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  blockchainEventId: z.number().int().optional(),
  // For oracle flow (links to service record)
  serviceRecordId: z.number().int().optional(),
});

export const evidenceIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const assetIdParamSchema = z.object({
  assetId: z.coerce.number().int().positive(),
});

export const hashParamSchema = z.object({
  hash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

export type CalculateEvidenceHashInput = z.infer<typeof calculateEvidenceHashSchema>;
export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>;
export type EvidenceIdParam = z.infer<typeof evidenceIdParamSchema>;
export type AssetIdParam = z.infer<typeof assetIdParamSchema>;
export type HashParam = z.infer<typeof hashParamSchema>;

export interface CalculateHashResponse {
  dataHash: string;
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

export function formatEvidenceResponse(ev: Evidence): EvidenceResponse {
  return {
    id: ev.id,
    assetId: Number(ev.assetId),
    dataHash: ev.dataHash,
    serviceRecordId: ev.serviceRecordId ? Number(ev.serviceRecordId) : null,
    eventType: ev.eventType,
    eventDate: ev.eventDate,
    providerName: ev.providerName,
    description: ev.description,
    eventData: ev.eventData as Record<string, unknown> | null,
    status: ev.status,
    isVerified: ev.isVerified,
    verifiedBy: ev.verifiedBy,
    blockchainEventId: ev.blockchainEventId ? Number(ev.blockchainEventId) : null,
    txHash: ev.txHash,
    createdBy: ev.createdBy,
    createdAt: ev.createdAt.toISOString(),
    confirmedAt: ev.confirmedAt?.toISOString() || null,
    verifiedAt: ev.verifiedAt?.toISOString() || null,
  };
}
