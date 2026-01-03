import { db } from "../db";
import { assets, evidence, verificationRequests } from "../db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { NotFoundException } from "../lib/exceptions";
import { VerificationStatus } from "../lib/enums";
import { createSuccessResponse, type SuccessResponse } from "../dtos/base.dto";
import {
  type CreateVerificationRequestInput,
  type UpdateVerificationRequestInput,
  type VerificationRequestResponse,
  formatVerificationRequestResponse
} from "../dtos/verification.dto";
import type { AuthUser } from "../types";

function generateRequestId(): string {
  return `VR-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function createVerificationRequest(
  input: CreateVerificationRequestInput,
  authUser: AuthUser
): Promise<SuccessResponse<VerificationRequestResponse>> {
  // Validate that asset exists
  const assetExists = await db
    .select({ id: assets.id })
    .from(assets)
    .where(eq(assets.assetId, input.assetId))
    .limit(1);

  if (assetExists.length === 0) {
    throw new NotFoundException("Asset not found");
  }

  // Check for existing PENDING request (idempotency)
  const providerCondition = input.providerId
    ? eq(verificationRequests.providerId, input.providerId)
    : isNull(verificationRequests.providerId);

  const existingRequest = await db
    .select()
    .from(verificationRequests)
    .where(
      and(
        eq(verificationRequests.assetId, input.assetId),
        eq(verificationRequests.requestType, input.requestType),
        providerCondition,
        eq(verificationRequests.requestedBy, authUser.address.toLowerCase()),
        eq(verificationRequests.status, VerificationStatus.PENDING)
      )
    )
    .limit(1);

  // If PENDING request already exists, return it (idempotent)
  if (existingRequest.length > 0) {
    return createSuccessResponse(
      formatVerificationRequestResponse(existingRequest[0]),
      "Verification request already exists"
    );
  }

  // Create new request
  const requestId = generateRequestId();

  const inserted = await db
    .insert(verificationRequests)
    .values({
      requestId,
      assetId: input.assetId,
      requestType: input.requestType,
      providerId: input.providerId || null,
      requestedBy: authUser.address.toLowerCase(),
      status: VerificationStatus.PENDING,
    })
    .returning();

  return createSuccessResponse(formatVerificationRequestResponse(inserted[0]), "Verification request created successfully");
}

export async function getPendingVerificationRequests(): Promise<
  SuccessResponse<VerificationRequestResponse[]>
> {
  const results = await db
    .select()
    .from(verificationRequests)
    .where(eq(verificationRequests.status, VerificationStatus.PENDING));

  return createSuccessResponse(results.map(formatVerificationRequestResponse), "Pending requests retrieved successfully");
}

export async function updateVerificationRequest(
  requestId: string,
  input: UpdateVerificationRequestInput
): Promise<SuccessResponse<VerificationRequestResponse>> {
  // Validate that evidence exists if evidenceId is provided
  if (input.evidenceId !== undefined) {
    const evidenceExists = await db
      .select({ id: evidence.id })
      .from(evidence)
      .where(eq(evidence.id, input.evidenceId))
      .limit(1);

    if (evidenceExists.length === 0) {
      throw new NotFoundException("Evidence not found");
    }
  }

  const updates: Record<string, unknown> = {
    status: input.status,
  };

  if (
    input.status === VerificationStatus.COMPLETED ||
    input.status === VerificationStatus.FAILED
  ) {
    updates.processedAt = new Date();
  }

  if (input.blockchainEventId !== undefined)
    updates.blockchainEventId = input.blockchainEventId;
  if (input.txHash !== undefined) updates.txHash = input.txHash;
  if (input.dataHash !== undefined) updates.dataHash = input.dataHash;
  if (input.evidenceId !== undefined) updates.evidenceId = input.evidenceId;
  if (input.errorMessage !== undefined)
    updates.errorMessage = input.errorMessage;

  const updated = await db
    .update(verificationRequests)
    .set(updates)
    .where(eq(verificationRequests.requestId, requestId))
    .returning();

  if (updated.length === 0) {
    throw new NotFoundException("Verification request not found");
  }

  return createSuccessResponse(formatVerificationRequestResponse(updated[0]), "Verification request updated successfully");
}
