import { db } from "../db";
import { evidence } from "../db/schema";
import { eq } from "drizzle-orm";
import { calculateHash } from "../lib/hash";
import { NotFoundException } from "../lib/exceptions";
import { createSuccessResponse, type SuccessResponse } from "../dtos/base.dto";
import type { CreateEvidenceInput, EvidenceResponse } from "../dtos/evidence.dto";

export async function createEvidence(input: CreateEvidenceInput): Promise<SuccessResponse<EvidenceResponse>> {
  // Calculate data hash
  const dataHash = calculateHash(input);

  // Insert evidence
  const inserted = await db
    .insert(evidence)
    .values({
      assetId: input.assetId,
      dataHash,
      eventType: input.eventType,
      eventDate: input.eventDate,
      providerId: input.providerId || null,
      providerName: input.providerName || null,
      description: input.description || null,
      files: input.files || [],
      metadata: input.metadata || null,
      isVerified: false,
    })
    .returning();

  return createSuccessResponse(formatEvidenceResponse(inserted[0]), "Evidence created successfully");
}

export async function getEvidenceByHash(dataHash: string): Promise<SuccessResponse<EvidenceResponse>> {
  const result = await db
    .select()
    .from(evidence)
    .where(eq(evidence.dataHash, dataHash))
    .limit(1);

  if (result.length === 0) {
    throw new NotFoundException("Evidence not found");
  }

  return createSuccessResponse(formatEvidenceResponse(result[0]), "Evidence retrieved successfully");
}

export async function getEvidenceByAssetId(assetId: number): Promise<SuccessResponse<EvidenceResponse[]>> {
  const results = await db
    .select()
    .from(evidence)
    .where(eq(evidence.assetId, assetId));

  return createSuccessResponse(results.map(formatEvidenceResponse), "Evidence list retrieved successfully");
}

function formatEvidenceResponse(ev: typeof evidence.$inferSelect): EvidenceResponse {
  return {
    id: ev.id,
    assetId: ev.assetId,
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
    blockchainEventId: ev.blockchainEventId,
    txHash: ev.txHash,
    createdAt: ev.createdAt.toISOString(),
    verifiedAt: ev.verifiedAt?.toISOString() || null,
  };
}
