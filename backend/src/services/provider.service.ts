import { db } from "../db";
import {
  assets,
  serviceRecordsProviderA,
  processedServiceRecords,
} from "../db/schema";
import { eq } from "drizzle-orm";
import { NotFoundException } from "../lib/exceptions";
import { createSuccessResponse, type SuccessResponse } from "../dtos/base.dto";
import {
  type CreateServiceRecordInput,
  type ServiceRecordResponse,
  formatServiceRecordResponse,
} from "../dtos/provider.dto";

/**
 * Generate a unique record ID for a service record.
 * Format: SR-{timestamp}-{random}
 */
function generateRecordId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `SR-${timestamp}-${random}`;
}

/**
 * Create a new service record from provider API.
 * This record will be picked up by the oracle for processing.
 */
export async function createServiceRecord(
  input: CreateServiceRecordInput,
  providerId: string
): Promise<SuccessResponse<ServiceRecordResponse>> {
  // Validate that asset exists
  const assetExists = await db
    .select({ id: assets.id })
    .from(assets)
    .where(eq(assets.assetId, input.assetId))
    .limit(1);

  if (assetExists.length === 0) {
    throw new NotFoundException("Asset not found");
  }

  const recordId = generateRecordId();

  // Insert service record
  const inserted = await db
    .insert(serviceRecordsProviderA)
    .values({
      recordId,
      assetId: input.assetId,
      providerId,
      eventType: input.eventType,
      eventName: input.eventName,
      serviceDate: input.serviceDate,
      technicianName: input.technicianName || null,
      technicianNotes: input.technicianNotes || null,
      workPerformed: input.workPerformed || null,
      partsReplaced: input.partsReplaced || null,
      verified: true, // Provider-submitted records are considered verified
    })
    .returning();

  return createSuccessResponse(
    formatServiceRecordResponse(inserted[0]),
    "Service record created successfully. It will be processed by the oracle."
  );
}

/**
 * Get a service record by record ID.
 * Includes processing status if available.
 */
export async function getServiceRecordByRecordId(
  recordId: string
): Promise<SuccessResponse<ServiceRecordResponse>> {
  const record = await db
    .select()
    .from(serviceRecordsProviderA)
    .where(eq(serviceRecordsProviderA.recordId, recordId))
    .limit(1);

  if (record.length === 0) {
    throw new NotFoundException("Service record not found");
  }

  // Get processing status if available
  const processing = await db
    .select()
    .from(processedServiceRecords)
    .where(eq(processedServiceRecords.serviceRecordId, record[0].id))
    .limit(1);

  return createSuccessResponse(
    formatServiceRecordResponse(record[0], processing[0] || null),
    "Service record retrieved successfully"
  );
}

/**
 * Get all service records for an asset.
 */
export async function getServiceRecordsByAssetId(
  assetId: number
): Promise<SuccessResponse<ServiceRecordResponse[]>> {
  // Validate that asset exists
  const assetExists = await db
    .select({ id: assets.id })
    .from(assets)
    .where(eq(assets.assetId, assetId))
    .limit(1);

  if (assetExists.length === 0) {
    throw new NotFoundException("Asset not found");
  }

  const records = await db
    .select()
    .from(serviceRecordsProviderA)
    .where(eq(serviceRecordsProviderA.assetId, assetId));

  // Get processing status for all records
  const recordIds = records.map((r) => r.id);
  const processingStatuses =
    recordIds.length > 0
      ? await db.select().from(processedServiceRecords)
      : [];

  // Create a map of service record ID to processing info
  const processingMap = new Map(
    processingStatuses.map((p) => [Number(p.serviceRecordId), p])
  );

  return createSuccessResponse(
    records.map((r) => formatServiceRecordResponse(r, processingMap.get(r.id))),
    "Service records retrieved successfully"
  );
}
