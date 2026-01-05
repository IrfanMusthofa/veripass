import { db } from "../db";
import { assets, evidence } from "../db/schema";
import { eq } from "drizzle-orm";
import { calculateHash } from "../lib/hash";
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "../lib/exceptions";
import { createSuccessResponse, type SuccessResponse } from "../dtos/base.dto";
import {
  type CalculateEvidenceHashInput,
  type CreateEvidenceInput,
  type CalculateHashResponse,
  type EvidenceResponse,
  formatEvidenceResponse,
} from "../dtos/evidence.dto";
import type { AuthUser } from "../types";

/**
 * Calculate evidence hash without creating a database record.
 * Used by frontend to get dataHash before recording on blockchain.
 */
export async function calculateEvidenceHash(
  input: CalculateEvidenceHashInput
): Promise<SuccessResponse<CalculateHashResponse>> {
  // Build data to hash (same structure as createEvidence)
  const hashData = {
    assetId: input.assetId,
    eventType: input.eventType,
    eventDate: input.eventDate || new Date().toISOString().split("T")[0],
    providerName: input.providerName || "",
    description: input.description || "",
    notes: input.notes || "",
    eventData: input.eventData || {},
  };

  const dataHash = calculateHash(hashData);

  return createSuccessResponse(
    { dataHash },
    "Hash calculated successfully"
  );
}

/**
 * Create evidence record.
 *
 * Two flows:
 * 1. Custom event (frontend): txHash provided -> create as CONFIRMED (already on blockchain)
 * 2. Oracle flow: no txHash -> create as PENDING (oracle will record on blockchain)
 */
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

  // If txHash is provided, this is a custom event from frontend
  // Only CUSTOM events can be recorded directly by users
  const isCustomEventFlow = !!input.txHash;

  if (isCustomEventFlow && input.eventType !== "CUSTOM") {
    throw new BadRequestException(
      "Only CUSTOM events can be recorded directly. Other event types must be submitted by service providers."
    );
  }

  // Build data to hash (includes all fields that should be in the hash)
  const hashData = {
    assetId: input.assetId,
    eventType: input.eventType,
    eventDate: input.eventDate || new Date().toISOString().split("T")[0],
    providerName: input.providerName || "",
    description: input.description || "",
    notes: (input.eventData as Record<string, unknown>)?.notes || "",
    eventData: input.eventData || {},
  };

  const dataHash = calculateHash(hashData);

  // Check if evidence with same hash already exists
  const existing = await db
    .select()
    .from(evidence)
    .where(eq(evidence.dataHash, dataHash))
    .limit(1);

  if (existing.length > 0) {
    // If already CONFIRMED, don't allow duplicate
    if (existing[0].status === "CONFIRMED") {
      throw new ConflictException("Evidence already exists and is confirmed");
    }
    // If PENDING and this is custom flow with txHash, allow retry/update
    if (existing[0].status === "PENDING" && isCustomEventFlow) {
      // Update the pending record to confirmed
      const updated = await db
        .update(evidence)
        .set({
          status: "CONFIRMED",
          txHash: input.txHash,
          blockchainEventId: input.blockchainEventId || null,
          confirmedAt: new Date(),
        })
        .where(eq(evidence.id, existing[0].id))
        .returning();

      return createSuccessResponse(
        formatEvidenceResponse(updated[0]),
        "Evidence confirmed successfully"
      );
    }
    // If PENDING and no txHash (oracle retry), return existing
    if (existing[0].status === "PENDING" && !isCustomEventFlow) {
      return createSuccessResponse(
        formatEvidenceResponse(existing[0]),
        "Evidence already exists (pending confirmation)"
      );
    }
  }

  // Insert evidence
  const inserted = await db
    .insert(evidence)
    .values({
      assetId: input.assetId,
      dataHash,
      serviceRecordId: input.serviceRecordId || null,
      eventType: input.eventType,
      eventDate: input.eventDate || null,
      providerName: input.providerName || null,
      description: input.description || null,
      eventData: input.eventData || null,
      // Custom event flow: already on blockchain -> CONFIRMED
      // Oracle flow: not yet on blockchain -> PENDING
      status: isCustomEventFlow ? "CONFIRMED" : "PENDING",
      txHash: input.txHash || null,
      blockchainEventId: input.blockchainEventId || null,
      confirmedAt: isCustomEventFlow ? new Date() : null,
      isVerified: false, // Only oracle can set this to true
      createdBy: authUser.address,
    })
    .returning();

  return createSuccessResponse(
    formatEvidenceResponse(inserted[0]),
    isCustomEventFlow
      ? "Custom event recorded successfully"
      : "Evidence created successfully"
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
