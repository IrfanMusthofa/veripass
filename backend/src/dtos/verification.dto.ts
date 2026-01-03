import { z } from "zod";
import { VerificationStatus } from "../lib/enums";
import type { VerificationRequest } from "../db/schema";

export const createVerificationRequestSchema = z.object({
  assetId: z.number().int().positive(),
  requestType: z.enum(["SERVICE_VERIFICATION", "AUTHENTICITY_CHECK"]),
  providerId: z.string().max(255).optional(),
});

export const updateVerificationRequestSchema = z.object({
  status: z.enum(Object.values(VerificationStatus)),
  blockchainEventId: z.number().int().optional(),
  txHash: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/)
    .optional(),
  dataHash: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/)
    .optional(),
  evidenceId: z.number().int().optional(),
  errorMessage: z.string().optional(),
});

export const requestIdParamSchema = z.object({
  requestId: z.string().min(1),
});

export type CreateVerificationRequestInput = z.infer<
  typeof createVerificationRequestSchema
>;
export type UpdateVerificationRequestInput = z.infer<
  typeof updateVerificationRequestSchema
>;
export type RequestIdParam = z.infer<typeof requestIdParamSchema>;

export interface VerificationRequestResponse {
  id: number;
  requestId: string;
  assetId: number;
  requestType: string;
  providerId: string | null;
  requestedBy: string;
  status: string;
  blockchainEventId: number | null;
  txHash: string | null;
  dataHash: string | null;
  evidenceId: number | null;
  errorMessage: string | null;
  createdAt: string;
  processedAt: string | null;
}

export function formatVerificationRequestResponse(
  req: VerificationRequest
): VerificationRequestResponse {
  return {
    id: req.id,
    requestId: req.requestId,
    assetId: Number(req.assetId),
    requestType: req.requestType,
    providerId: req.providerId,
    requestedBy: req.requestedBy,
    status: req.status,
    blockchainEventId: req.blockchainEventId ? Number(req.blockchainEventId) : null,
    txHash: req.txHash,
    dataHash: req.dataHash,
    evidenceId: req.evidenceId ? Number(req.evidenceId) : null,
    errorMessage: req.errorMessage,
    createdAt: req.createdAt.toISOString(),
    processedAt: req.processedAt?.toISOString() || null,
  };
}
