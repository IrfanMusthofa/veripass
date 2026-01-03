import { z } from "zod";
import { EventType } from "../lib/enums";
import type { Evidence } from "../db/schema";

export const createEvidenceSchema = z.object({
  assetId: z.number().int().positive(),
  eventType: z.enum(Object.values(EventType)),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  providerId: z.string().max(255).optional(),
  providerName: z.string().max(255).optional(),
  description: z.string().optional(),
  files: z
    .array(
      z.object({
        url: z.url(),
        type: z.string(),
        name: z.string(),
      })
    )
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const assetIdParamSchema = z.object({
  assetId: z.coerce.number().int().positive(),
});

export const hashParamSchema = z.object({
  hash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>;
export type AssetIdParam = z.infer<typeof assetIdParamSchema>;
export type HashParam = z.infer<typeof hashParamSchema>;

export interface EvidenceResponse {
  id: number;
  assetId: number;
  dataHash: string;
  eventType: string;
  eventDate: string | null;
  providerId: string | null;
  providerName: string | null;
  description: string | null;
  files: Array<{ url: string; type: string; name: string }>;
  metadata: Record<string, unknown> | null;
  isVerified: boolean;
  verifiedBy: string | null;
  blockchainEventId: number | null;
  txHash: string | null;
  createdBy: string;
  createdAt: string;
  verifiedAt: string | null;
}

export function formatEvidenceResponse(ev: Evidence): EvidenceResponse {
  return {
    id: ev.id,
    assetId: Number(ev.assetId),
    dataHash: ev.dataHash,
    eventType: ev.eventType,
    eventDate: ev.eventDate,
    providerId: ev.providerId,
    providerName: ev.providerName,
    description: ev.description,
    files: (ev.files as Array<{ url: string; type: string; name: string }>) || [],
    metadata: ev.metadata as Record<string, unknown> | null,
    isVerified: ev.isVerified,
    verifiedBy: ev.verifiedBy,
    blockchainEventId: ev.blockchainEventId ? Number(ev.blockchainEventId) : null,
    txHash: ev.txHash,
    createdBy: ev.createdBy,
    createdAt: ev.createdAt.toISOString(),
    verifiedAt: ev.verifiedAt?.toISOString() || null,
  };
}
