import { db } from "../db";
import { assets, evidence } from "../db/schema";
import { eq } from "drizzle-orm";
import { calculateHash } from "../lib/hash";
import { NotFoundException } from "../lib/exceptions";
import { createSuccessResponse, type SuccessResponse } from "../dtos/base.dto";
import { type CreateEvidenceInput, type EvidenceResponse, formatEvidenceResponse   } from "../dtos/evidence.dto";
import type { AuthUser } from "../types";

export async function createEvidence(
  input: CreateEvidenceInput,
  authUser: AuthUser
): Promise<SuccessResponse<EvidenceResponse>> {
  // Validate that asset exists
  const assetExists = await db
    .select({ id: assets.id })
    .from(assets)
    .where(eq(assets.assetId, input.assetId))
    .limit(1);

  if (assetExists.length === 0) {
    throw new NotFoundException("Asset not found");
  }

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
      createdBy: authUser.address,
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
  // Validate that asset exists
  const assetExists = await db
    .select({ id: assets.id })
    .from(assets)
    .where(eq(assets.assetId, assetId))
    .limit(1);

  if (assetExists.length === 0) {
    throw new NotFoundException("Asset not found");
  }

  const results = await db
    .select()
    .from(evidence)
    .where(eq(evidence.assetId, assetId));

  return createSuccessResponse(results.map(formatEvidenceResponse), "Evidence list retrieved successfully");
}
