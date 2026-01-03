import { db } from "../db";
import { verificationRequests } from "../db/schema";
import { eq } from "drizzle-orm";
import { NotFoundException } from "../lib/exceptions";
import { VerificationStatus } from "../lib/enums";
import { createSuccessResponse, type SuccessResponse } from "../dtos/base.dto";
import type {
  CreateVerificationRequestInput,
  UpdateVerificationRequestInput,
  VerificationRequestResponse,
} from "../dtos/verification.dto";

function generateRequestId(): string {
  return `VR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function createVerificationRequest(
  input: CreateVerificationRequestInput
): Promise<SuccessResponse<VerificationRequestResponse>> {
  const requestId = generateRequestId();

  const inserted = await db
    .insert(verificationRequests)
    .values({
      requestId,
      assetId: input.assetId,
      requestType: input.requestType,
      providerId: input.providerId || null,
      requestedBy: input.requestedBy.toLowerCase(),
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

function formatVerificationRequestResponse(
  req: typeof verificationRequests.$inferSelect
): VerificationRequestResponse {
  return {
    id: req.id,
    requestId: req.requestId,
    assetId: req.assetId,
    requestType: req.requestType,
    providerId: req.providerId,
    requestedBy: req.requestedBy,
    status: req.status,
    blockchainEventId: req.blockchainEventId,
    txHash: req.txHash,
    dataHash: req.dataHash,
    evidenceId: req.evidenceId,
    errorMessage: req.errorMessage,
    createdAt: req.createdAt.toISOString(),
    processedAt: req.processedAt?.toISOString() || null,
  };
}
