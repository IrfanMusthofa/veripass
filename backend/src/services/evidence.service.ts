import { db } from "../db";
import { assets, evidence } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { calculateHash } from "../lib/hash";
import { NotFoundException, ConflictException } from "../lib/exceptions";
import { createSuccessResponse, type SuccessResponse } from "../dtos/base.dto";
import {
  type CreateEvidenceInput,
  type ConfirmEvidenceInput,
  type EvidenceResponse,
  formatEvidenceResponse,
} from "../dtos/evidence.dto";
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

  // Build data to hash (includes all fields that should be in the hash)
  const hashData = {
    assetId: input.assetId,
    eventType: input.eventType,
    eventDate: input.eventDate,
    providerName: input.providerName,
    description: input.description,
    eventData: input.eventData,
  };

  const dataHash = calculateHash(hashData);

  // Check if evidence with same hash already exists
  const existing = await db
    .select()
    .from(evidence)
    .where(eq(evidence.dataHash, dataHash))
    .limit(1);

  if (existing.length > 0) {
    // If PENDING, return existing (allow retry)
    if (existing[0].status === "PENDING") {
      return createSuccessResponse(
        formatEvidenceResponse(existing[0]),
        "Evidence already exists (pending confirmation)"
      );
    }
    throw new ConflictException("Evidence already exists");
  }

  // Insert evidence with PENDING status
  const inserted = await db
    .insert(evidence)
    .values({
      assetId: input.assetId,
      dataHash,
      eventType: input.eventType,
      eventDate: input.eventDate || null,
      providerName: input.providerName || null,
      description: input.description || null,
      eventData: input.eventData || null,
      status: "PENDING",
      isVerified: false,
      createdBy: authUser.address,
    })
    .returning();

  return createSuccessResponse(
    formatEvidenceResponse(inserted[0]),
    "Evidence created successfully"
  );
}

export async function confirmEvidence(
  evidenceId: number,
  input: ConfirmEvidenceInput,
  _authUser: AuthUser
): Promise<SuccessResponse<EvidenceResponse>> {
  // Find the pending evidence
  const existing = await db
    .select()
    .from(evidence)
    .where(and(eq(evidence.id, evidenceId), eq(evidence.status, "PENDING")))
    .limit(1);

  if (existing.length === 0) {
    throw new NotFoundException("Pending evidence not found");
  }

  // Update to CONFIRMED
  const updated = await db
    .update(evidence)
    .set({
      status: "CONFIRMED",
      txHash: input.txHash,
      blockchainEventId: input.blockchainEventId || null,
      confirmedAt: new Date(),
    })
    .where(eq(evidence.id, evidenceId))
    .returning();

  return createSuccessResponse(
    formatEvidenceResponse(updated[0]),
    "Evidence confirmed successfully"
  );
}

export async function getEvidenceByHash(
  dataHash: string
): Promise<SuccessResponse<EvidenceResponse>> {
  const result = await db
    .select()
    .from(evidence)
    .where(eq(evidence.dataHash, dataHash))
    .limit(1);

  if (result.length === 0) {
    throw new NotFoundException("Evidence not found");
  }

  return createSuccessResponse(
    formatEvidenceResponse(result[0]),
    "Evidence retrieved successfully"
  );
}

export async function getEvidenceByAssetId(
  assetId: number
): Promise<SuccessResponse<EvidenceResponse[]>> {
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

  return createSuccessResponse(
    results.map(formatEvidenceResponse),
    "Evidence list retrieved successfully"
  );
}

